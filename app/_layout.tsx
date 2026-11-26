import '../global.css';
import { PlusJakartaSans_400Regular } from '@expo-google-fonts/plus-jakarta-sans/400Regular';
import { PlusJakartaSans_500Medium } from '@expo-google-fonts/plus-jakarta-sans/500Medium';
import { PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans/600SemiBold';
import { PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans/700Bold';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { authService } from '@/features/authentication/services/auth-service';
import { useAuthStore } from '@/features/authentication/store/auth-store';
import { usePushNotifications } from '@/features/notifications/notification-service';
import { BuilderLinkFullScreenLoader } from '@/shared/components/builderlink-loader';
import { ToastHost } from '@/shared/components/toast';
import { useThemeColors } from '@/shared/theme';
import type { AuthSession } from '@/shared/types';

const client = new QueryClient();

export default function RootLayout() {
  const colors = useThemeColors();
  const setSession = useAuthStore((state) => state.setSession);
  const [sessionReady, setSessionReady] = useState(false);
  const unsubRef = useRef<(() => void) | null>(null);

  // Names here are the font families referenced in tailwind.config.js.
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    // Rehydrate the session from Firebase on every app launch
    unsubRef.current = authService.onAuthStateChange((session: AuthSession) => {
      setSession(session);
      setSessionReady(true);
    });
    return () => {
      unsubRef.current?.();
    };
  }, [setSession]);

  // Wait for the persisted session and the fonts. If the fonts fail to load,
  // carry on with the system font rather than blocking the app.
  if (!sessionReady || (!fontsLoaded && !fontError)) {
    return (
      // White to match the native splash screen (app.json) it takes over from.
      <BuilderLinkFullScreenLoader />
    );
  }

  return (
    <QueryClientProvider client={client}>
      <StatusBar style="auto" />
      <PushNotifications />
      <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: colors.canvas } }} />
      <ToastHost />
    </QueryClientProvider>
  );
}

function PushNotifications() {
  usePushNotifications(useAuthStore((state) => state.session?.userId));
  return null;
}
