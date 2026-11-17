import * as ImagePicker from 'expo-image-picker';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Timestamp,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { firebaseDb, firebaseStorage } from '@/shared/services/firebase';

export const MAX_PORTFOLIO_PHOTOS = 12;

export type PortfolioPhoto = { id: string; storagePath: string; url: string; caption: string | null; createdAt: Date | null };

export type DocumentType = 'national_id' | 'certificate' | 'license';
export type DocumentReviewStatus = 'pending' | 'approved' | 'rejected';
export type BuilderDocument = { id: string; type: DocumentType; storagePath: string; reviewStatus: DocumentReviewStatus; createdAt: Date | null };

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  national_id: 'National ID',
  certificate: 'Trade certificate',
  license: 'Business licence',
};

const services = () => {
  if (!firebaseDb || !firebaseStorage) throw new Error('Firebase is not configured.');
  return { db: firebaseDb, storage: firebaseStorage };
};

/** Raised when the person closes the picker or refuses photo access; not a failure to report. */
export class PickCancelled extends Error {}
export class PhotoPermissionDenied extends Error {}

/** Let the user choose one photo, resized and compressed for upload. */
export async function pickPhoto(): Promise<ImagePicker.ImagePickerAsset> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new PhotoPermissionDenied('Photo access was not allowed.');
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.7,
  });
  if (result.canceled || !result.assets[0]) throw new PickCancelled();
  return result.assets[0];
}

async function upload(path: string, asset: ImagePicker.ImagePickerAsset): Promise<void> {
  const { storage } = services();
  const blob = await (await fetch(asset.uri)).blob();
  if (blob.size > 5 * 1024 * 1024) throw new Error('This photo is larger than 5 MB. Choose a smaller one.');
  await uploadBytes(ref(storage, path), blob, { contentType: asset.mimeType ?? 'image/jpeg' });
}

// ---------------------------------------------------------------
// Portfolio (public work photos)
// ---------------------------------------------------------------

export async function fetchPortfolio(builderId: string): Promise<PortfolioPhoto[]> {
  const { db, storage } = services();
  const results = await getDocs(query(collection(db, 'portfolio_items'), where('builder_id', '==', builderId)));
  const photos = await Promise.all(
    results.docs.map(async (item) => {
      const raw = item.data() as { storage_path: string; caption?: string | null; created_at?: Timestamp | null };
      try {
        return {
          id: item.id,
          storagePath: raw.storage_path,
          url: await getDownloadURL(ref(storage, raw.storage_path)),
          caption: raw.caption ?? null,
          createdAt: raw.created_at?.toDate() ?? null,
        };
      } catch {
        // The file is missing (e.g. a half-finished upload); skip it.
        return null;
      }
    }),
  );
  return photos
    .filter((photo): photo is PortfolioPhoto => photo !== null)
    .sort((a, b) => (b.createdAt?.getTime() ?? Date.now()) - (a.createdAt?.getTime() ?? Date.now()));
}

export async function addPortfolioPhoto(builderId: string, asset: ImagePicker.ImagePickerAsset): Promise<void> {
  const { db } = services();
  const record = doc(collection(db, 'portfolio_items'));
  const storagePath = `builders/${builderId}/portfolio/${record.id}.jpg`;
  await upload(storagePath, asset);
  await setDoc(record, { id: record.id, builder_id: builderId, storage_path: storagePath, caption: null, created_at: serverTimestamp() });
}

export async function removePortfolioPhoto(photo: PortfolioPhoto): Promise<void> {
  const { db, storage } = services();
  await deleteDoc(doc(db, 'portfolio_items', photo.id));
  await deleteObject(ref(storage, photo.storagePath)).catch(() => undefined);
}

// ---------------------------------------------------------------
// Verification documents (private)
// ---------------------------------------------------------------

export async function fetchBuilderDocuments(builderId: string): Promise<BuilderDocument[]> {
  const { db } = services();
  const results = await getDocs(query(collection(db, 'builder_documents'), where('builder_id', '==', builderId)));
  return results.docs.map((item) => {
    const raw = item.data() as { type: DocumentType; storage_path: string; review_status: DocumentReviewStatus; created_at?: Timestamp | null };
    return { id: item.id, type: raw.type, storagePath: raw.storage_path, reviewStatus: raw.review_status, createdAt: raw.created_at?.toDate() ?? null };
  });
}

export async function uploadBuilderDocument(builderId: string, type: DocumentType, asset: ImagePicker.ImagePickerAsset): Promise<void> {
  const { db } = services();
  const record = doc(collection(db, 'builder_documents'));
  const storagePath = `builders/${builderId}/documents/${record.id}.jpg`;
  await upload(storagePath, asset);
  await setDoc(record, { id: record.id, builder_id: builderId, type, storage_path: storagePath, review_status: 'pending', created_at: serverTimestamp() });
}

export async function removeBuilderDocument(document: BuilderDocument): Promise<void> {
  const { db, storage } = services();
  await deleteDoc(doc(db, 'builder_documents', document.id));
  await deleteObject(ref(storage, document.storagePath)).catch(() => undefined);
}
