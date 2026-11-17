import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { authService } from '../services/auth-service';
import { useAuthStore } from '../store/auth-store';
import type { UserRole } from '@/shared/types';
import { useThemeColors } from '@/shared/theme';

const webClientId = process.env.EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID;

/** Google sign-in is only offered when a client ID is configured. */
export const isGoogleAuthConfigured = Boolean(webClientId);

// The web client ID is what makes Google return an ID token Firebase accepts.
// The Android OAuth client is matched by Google from the package name + SHA-1.
if (webClientId) GoogleSignin.configure({ webClientId });

type Props = {
  /** Role to assign when this creates a brand-new account (defaults to 'customer'). */
  role?: UserRole;
  /** Called after a successful Google sign-in/sign-up. */
  onSuccess?: () => void;
};

/**
 * "Continue with Google" button for sign-in and sign-up.
 * Uses the native Google Sign-In account picker to obtain an ID token, then
 * exchanges it for a Firebase credential and syncs the Firestore profile.
 */
export function GoogleSignInButton({ role = 'customer', onSuccess }: Props) {
  const colors = useThemeColors();
  const setSession = useAuthStore((state) => state.setSession);
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      // Forget the previously chosen account so the picker is always shown.
      await GoogleSignin.signOut().catch(() => undefined);

      const response = await GoogleSignin.signIn();
      if (!isSuccessResponse(response)) return; // user cancelled

      const idToken = response.data.idToken;
      if (!idToken) throw new Error('Google did not return an ID token.');

      const session = await authService.signInWithGoogle(idToken, role);
      setSession(session);
      onSuccess?.();
    } catch (error) {
      const code = isErrorWithCode(error) ? error.code : (error as { code?: string }).code;
      console.warn('Google sign-in failed:', code ?? error, error);

      if (code === statusCodes.IN_PROGRESS || code === statusCodes.SIGN_IN_CANCELLED) {
        return;
      } else if (code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Google sign-in unavailable', 'Google Play services is missing or out of date on this device.');
      } else if (code === 'auth/account-exists-with-different-credential') {
        Alert.alert(
          'Account already exists',
          'An account with this email already exists. Sign in with your email and password instead.',
        );
      } else {
        const detail = code ? ` (${code})` : '';
        Alert.alert('Google sign-in failed', `We couldn’t complete Google sign-in. Please try again.${detail}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ busy: loading, disabled: loading }}
        disabled={loading}
        onPress={handlePress}
        className={`h-14 flex-row items-center justify-center gap-3 rounded-xl border border-line bg-surface px-5 ${loading ? 'opacity-60' : ''}`}
      >
        {loading ? (
          <ActivityIndicator color={colors.ink} />
        ) : (
          <Text className="text-lg font-bold text-brand">G</Text>
        )}
        <Text className="text-base font-bold text-ink">Continue with Google</Text>
      </Pressable>
    </View>
  );
}
