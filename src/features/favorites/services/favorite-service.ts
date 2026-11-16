import { collection, deleteDoc, doc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { firebaseDb } from '@/shared/services/firebase';

const requireDb = () => {
  if (!firebaseDb) throw new Error('Firestore is not configured.');
  return firebaseDb;
};

/** One document per (user, builder) pair, so saving twice is harmless. */
const favoriteRef = (userId: string, builderId: string) =>
  doc(requireDb(), 'favorites', `${userId}_${builderId}`);

/** Ids of the builders this user has saved. */
export async function fetchFavoriteBuilderIds(userId: string): Promise<string[]> {
  const results = await getDocs(query(collection(requireDb(), 'favorites'), where('user_id', '==', userId)));
  return results.docs.map((result) => result.data().builder_id as string);
}

/** Save or unsave a builder for this user. */
export async function setFavorite(userId: string, builderId: string, saved: boolean): Promise<void> {
  const ref = favoriteRef(userId, builderId);
  if (saved) {
    await setDoc(ref, { user_id: userId, builder_id: builderId, created_at: serverTimestamp() });
  } else {
    await deleteDoc(ref);
  }
}
