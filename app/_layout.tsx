import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { authService } from '@/features/authentication/services/auth-service';
import { useAuthStore } from '@/features/authentication/store/auth-store';
import type { AuthSession } from '@/shared/types';

const client = new QueryClient();

export default function RootLayout() {
  const setSession = useAuthStore((state) => state.setSession);
  const [ready, setReady] = useState(false);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Rehydrate the session from Firebase on every app launch
    unsubRef.current = authService.onAuthStateChange((session: AuthSession) => {
      setSession(session);
      setReady(true);
    });
    return () => {
      unsubRef.current?.();
    };
  }, [setSession]);

  // Show a brief loading indicator while Firebase resolves the persisted session
  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={client}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
    </QueryClientProvider>
  );
}