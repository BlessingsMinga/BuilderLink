import { Redirect } from 'expo-router';
import { useAuthStore } from '@/features/authentication/store/auth-store';

export default function Index() {
  const session = useAuthStore((state) => state.session);
  // Send signed-in users straight to the app; everyone else to onboarding.
  return <Redirect href={session ? '/(tabs)' : '/onboarding'} />;
}
