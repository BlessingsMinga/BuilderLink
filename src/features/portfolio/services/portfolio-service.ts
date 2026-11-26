import * as ImagePicker from 'expo-image-picker';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Timestamp,
} from 'firebase/firestore';
import { firebaseDb } from '@/shared/services/firebase';

export const MAX_PORTFOLIO_PHOTOS = 12;

export type PhotoKind = 'before' | 'after';

export type PortfolioPhoto = {
  id: string;
  storagePath: string;
  url: string;
  caption: string | null;
  /** Labelled as a before or after shot of a job. */
  kind: PhotoKind | null;
  /** The completed BuilderLink booking this photo is from, if linked. */
  bookingId: string | null;
  /** The service of the linked job, e.g. "Plumbing". */
  service: string | null;
  createdAt: Date | null;
};

/** What the builder can say about a photo. */
export type PhotoDetails = { caption: string; kind: PhotoKind | null; bookingId: string | null; service: string | null };

const detailFields = (details: PhotoDetails) => ({
  caption: details.caption.trim() ? details.caption.trim() : null,
  kind: details.kind,
  booking_id: details.bookingId,
  service: details.bookingId ? details.service : null,
});

export type DocumentType = 'national_id' | 'certificate' | 'license';
export type DocumentReviewStatus = 'pending' | 'approved' | 'rejected';
export type BuilderDocument = { id: string; type: DocumentType; storagePath: string; reviewStatus: DocumentReviewStatus; createdAt: Date | null };

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  national_id: 'National ID',
  certificate: 'Trade certificate',
  license: 'Business licence',
};

const requireDb = () => {
  if (!firebaseDb) throw new Error('Firebase is not configured.');
  return firebaseDb;
};

// Photos are stored on Cloudinary's free plan (no card needed) instead of
// Firebase Storage, which requires the paid Blaze plan. Firestore keeps the
// returned URL in `storage_path`.
const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
/** Unsigned preset for public work photos. */
export const PORTFOLIO_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_PORTFOLIO_PRESET;
/** Unsigned preset with delivery type "authenticated", so ID photos aren't publicly viewable. */
const DOCUMENTS_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_DOCUMENTS_PRESET;

/** A smaller, auto-compressed version of a Cloudinary photo. */
export function thumbnailUrl(url: string, width: number): string {
  return url.replace('/image/upload/', `/image/upload/c_fill,w_${width},q_auto,f_auto/`);
}

/** Raised when the person closes the picker or refuses photo access; not a failure to report. */
export class PickCancelled extends Error {}
export class PhotoPermissionDenied extends Error {}

type PickOptions = {
  /** Take a new photo instead of choosing one. Default: 'library'. */
  source?: 'library' | 'camera';
  /** Show the square crop step. Default: true. */
  edit?: boolean;
};

/** Let the user choose (or take) one photo, compressed for upload. */
export async function pickPhoto({ source = 'library', edit = true }: PickOptions = {}): Promise<ImagePicker.ImagePickerAsset> {
  const permission =
    source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new PhotoPermissionDenied(source === 'camera' ? 'Camera access was not allowed.' : 'Photo access was not allowed.');
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: edit, quality: 0.7 };
  const result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || !result.assets[0]) throw new PickCancelled();
  return result.assets[0];
}

/** Upload a photo to Cloudinary and return its HTTPS URL. */
export async function upload(folder: string, preset: string | undefined, asset: ImagePicker.ImagePickerAsset): Promise<string> {
  if (!CLOUD_NAME || !preset) throw new Error('Photo uploads are not configured yet.');
  if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) throw new Error('This photo is larger than 5 MB. Choose a smaller one.');
  const form = new FormData();
  // React Native's FormData takes a { uri, name, type } file description.
  form.append('file', { uri: asset.uri, name: asset.fileName ?? 'photo.jpg', type: asset.mimeType ?? 'image/jpeg' } as unknown as Blob);
  form.append('upload_preset', preset);
  form.append('folder', folder);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: form });
  const result = (await response.json()) as { secure_url?: string; error?: { message: string } };
  if (!response.ok || !result.secure_url) throw new Error(result.error?.message ?? 'Upload failed (network).');
  return result.secure_url;
}

// ---------------------------------------------------------------
// Portfolio (public work photos)
// ---------------------------------------------------------------

export async function fetchPortfolio(builderId: string): Promise<PortfolioPhoto[]> {
  const results = await getDocs(query(collection(requireDb(), 'portfolio_items'), where('builder_id', '==', builderId)));
  return results.docs
    .map((item) => {
      const raw = item.data() as {
        storage_path: string;
        caption?: string | null;
        kind?: PhotoKind | null;
        booking_id?: string | null;
        service?: string | null;
        created_at?: Timestamp | null;
      };
      return {
        id: item.id,
        storagePath: raw.storage_path,
        url: raw.storage_path,
        caption: raw.caption ?? null,
        kind: raw.kind ?? null,
        bookingId: raw.booking_id ?? null,
        service: raw.service ?? null,
        createdAt: raw.created_at?.toDate() ?? null,
      };
    })
    .filter((photo) => photo.url.startsWith('https://'))
    .sort((a, b) => (b.createdAt?.getTime() ?? Date.now()) - (a.createdAt?.getTime() ?? Date.now()));
}

export async function addPortfolioPhoto(builderId: string, asset: ImagePicker.ImagePickerAsset, details: PhotoDetails): Promise<void> {
  const record = doc(collection(requireDb(), 'portfolio_items'));
  const url = await upload(`builders/${builderId}/portfolio`, PORTFOLIO_PRESET, asset);
  await setDoc(record, { id: record.id, builder_id: builderId, storage_path: url, ...detailFields(details), created_at: serverTimestamp() });
}

export async function updatePortfolioPhoto(photo: PortfolioPhoto, details: PhotoDetails): Promise<void> {
  await updateDoc(doc(requireDb(), 'portfolio_items', photo.id), detailFields(details));
}

/**
 * Deleting the Cloudinary file itself needs the account's secret key, which
 * can't be shipped in the app. Removing the record hides the photo everywhere.
 */
export async function removePortfolioPhoto(photo: PortfolioPhoto): Promise<void> {
  await deleteDoc(doc(requireDb(), 'portfolio_items', photo.id));
}

// ---------------------------------------------------------------
// Verification documents (private)
// ---------------------------------------------------------------

export async function fetchBuilderDocuments(builderId: string): Promise<BuilderDocument[]> {
  const results = await getDocs(query(collection(requireDb(), 'builder_documents'), where('builder_id', '==', builderId)));
  return results.docs.map((item) => {
    const raw = item.data() as { type: DocumentType; storage_path: string; review_status: DocumentReviewStatus; created_at?: Timestamp | null };
    return { id: item.id, type: raw.type, storagePath: raw.storage_path, reviewStatus: raw.review_status, createdAt: raw.created_at?.toDate() ?? null };
  });
}

export async function uploadBuilderDocument(builderId: string, type: DocumentType, asset: ImagePicker.ImagePickerAsset): Promise<void> {
  const record = doc(collection(requireDb(), 'builder_documents'));
  const url = await upload(`builders/${builderId}/documents`, DOCUMENTS_PRESET, asset);
  await setDoc(record, { id: record.id, builder_id: builderId, type, storage_path: url, review_status: 'pending', created_at: serverTimestamp() });
}

export async function removeBuilderDocument(document: BuilderDocument): Promise<void> {
  await deleteDoc(doc(requireDb(), 'builder_documents', document.id));
}
