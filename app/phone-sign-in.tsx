import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { PhoneRecaptcha, type PhoneRecaptchaHandle } from '@/features/authentication/components/phone-recaptcha';
import { authService } from '@/features/authentication/services/auth-service';
import { useAuthStore } from '@/features/authentication/store/auth-store';
import { AppButton } from '@/shared/components/app-button';
import { FormField } from '@/shared/components/form-field';
import { Screen } from '@/shared/components/screen';

export default function PhoneSignIn() {
  const recaptcha = useRef<PhoneRecaptchaHandle>(null);
  const setSession = useAuthStore((state) => state.setSession);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sendCode = async () => {
    const normalized = phone.replace(/\s/g, '');
    if (!/^\+265\d{9}$/.test(normalized)) {
      Alert.alert('Invalid number', 'Use a Malawi number in international format, for example +265991234567.');
      return;
    }
    if (!recaptcha.current) return;
    setLoading(true);
    try {
      setVerificationId(await recaptcha.current.requestVerificationId(normalized));
      Alert.alert('Code sent', 'Enter the verification code sent by SMS. Standard SMS rates may apply.');
    } catch (error) {
      Alert.alert('Could not send code', (error as Error).message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const confirmCode = async () => {
    if (!verificationId || code.trim().length < 6) return;
    setLoading(true);
    try {
      setSession(await authService.confirmPhoneSignIn(verificationId, code));
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Invalid code', 'Check the SMS code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <PhoneRecaptcha ref={recaptcha} />
      <Text className="text-3xl font-bold text-ink">Sign in with phone</Text>
      <Text className="mt-2 text-base leading-6 text-muted">We’ll send a one-time SMS verification code to your Malawi number.</Text>
      <View className="mt-8 gap-4">
        <FormField label="Malawi phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+265 991 234 567" />
        {verificationId ? <FormField label="SMS verification code" value={code} onChangeText={setCode} keyboardType="number-pad" placeholder="123456" /> : null}
        <AppButton label={verificationId ? 'Verify and sign in' : 'Send SMS code'} loading={loading} onPress={verificationId ? confirmCode : sendCode} />
        {verificationId ? <AppButton label="Send a new code" variant="outline" disabled={loading} onPress={sendCode} /> : null}
        <AppButton label="Back to sign in" variant="outline" disabled={loading} onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
