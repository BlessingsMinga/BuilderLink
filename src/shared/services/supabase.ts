import { createClient } from '@supabase/supabase-js';
import { firebaseAuth } from './firebase';
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const isSupabaseConfigured = Boolean(url && key);
export const supabase = isSupabaseConfigured ? createClient(url!, key!, { accessToken: async () => (await firebaseAuth?.currentUser?.getIdToken()) ?? null, auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }) : undefined;
