import * as Google from 'expo-auth-session/providers/google';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { authService } from '../services/auth-service';
import { useAuthStore } from '../store/auth-store';
import type { UserRole } from '@/shared/types';

const webClientId = process.env.EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID;
const androidClientId = process.env.EXPO_PUBLIC_FIREBASE_ANDROID_CLIENT_ID;
const iosClientId = process.env.EXPO_PUBLIC_FIREBASE_IOS_CLIENT_ID;

/** Google sign-in is only offered when a client ID is configured. */
export const isGoogleAuthConfigured = Boolean(webClientId);

type Props = {
  /** Role to assign when this creates a brand-new account (defaults to 'customer'). */
  role?: UserRole;
  /** Called after a successful Google sign-in/sign-up. */
  onSuccess?: () => void;
};

/**
 * "Continue with Google" button for sign-in and sign-up.
 * Uses expo-auth-session's Google provider to obtain an ID token, exchanges it
 * for a Firebase credential, and syncs the Supabase profile row.
 */
export function GoogleSignInButton({ role = 'customer', onSuccess }: Props) {
  const setSession = useAuthStore((state) => state.setSession);
  const [loading, setLoading] = useState(false);
  const handledRef = useRef(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId,
    androidClientId,
    iosClientId,
    selectAccount: true,
  });

  useEffect(() => {
    if (response == null) return;

    if (response.type !== 'success') {
      // Cancel/dismiss/error: just release the loading state.
      setLoading(false);
      return;
    }
    if (handledRef.current) return;
    handledRef.current = true;

    setLoading(true);
    const idToken = response.params.id_token ?? response.authentication?.idToken ?? undefined;
    (async () => {
      try {
        if (!idToken) throw new Error('Google did not return an ID token.');
        const session = await authService.signInWithGoogle(idToken, role);
        setSession(session);
        onSuccess?.();
      } catch (error) {
        const code = (error as { code?: string }).code;
        if (code === 'auth/account-exists-with-different-credential') {
          Alert.alert(
            'Account already exists',
            'An account with this email already exists. Sign in with your email and password instead.',
          );
        } else if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
          return;
        } else {
          Alert.alert('Google sign-in failed', 'We couldn’t complete Google sign-in. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [response, role, setSession, onSuccess]);

  const handlePress = () => {
    if (loading) return;
    if (!request) {
      Alert.alert('Google sign-in unavailable', 'Google sign-in is not configured for this build yet.');
      return;
    }
    handledRef.current = false;
    promptAsync().catch(() => setLoading(false));
  };

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ busy: loading, disabled: loading }}
        disabled={loading}
        onPress={handlePress}
        className={`h-14 flex-row items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 ${loading ? 'opacity-60' : ''}`}
      >
        {loading ? (
          <ActivityIndicator color="#F97316" />
        ) : (
          <Text className="text-lg font-extrabold text-brand">G</Text>
        )}
        <Text className="text-base font-bold text-ink">Continue with Google</Text>
      </Pressable>
    </View>
  );
}