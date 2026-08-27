import { useLocalSearchParams, router } from 'expo-router';
import { MailCheck } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { authService } from '@/features/authentication/services/auth-service';
import { AppButton } from '@/shared/components/app-button';
import { Screen } from '@/shared/components/screen';

export default function VerifyEmail() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const resend = async () => {
    setLoading(true);
    try {
      await authService.resendVerification();
      setSent(true);
    } catch {
      Alert.alert('Could not resend', 'Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkVerified = async () => {
    // Reload the user so Firebase picks up the latest emailVerified flag
    await authService.reloadUser();
    if (authService.isEmailVerified()) {
      router.replace('/(tabs)');
    } else {
      Alert.alert('Not verified yet', 'Open the link we sent to your email, then try again.');
    }
  };

  return (
    <Screen>
      <View className="flex-1 items-center justify-center">
        <View className="h-20 w-20 items-center justify-center rounded-3xl bg-orange-100">
          <MailCheck size={38} color="#F97316" />
        </View>
        <Text className="mt-7 text-center text-3xl font-extrabold text-ink">Verify your email</Text>
        <Text className="mt-3 text-center text-base leading-6 text-slate-500">
          We sent a verification link to {email}. Open it to secure your BuilderLink account.
        </Text>
        <View className="mt-9 w-full gap-3">
          <AppButton label="I’ve verified my email" onPress={checkVerified} />
          <AppButton
            label={sent ? 'Verification email sent' : 'Resend verification email'}
            loading={loading}
            variant="outline"
            onPress={resend}
            disabled={sent}
          />
        </View>
      </View>
    </Screen>
  );
}