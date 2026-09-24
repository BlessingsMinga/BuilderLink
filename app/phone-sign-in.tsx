import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import type { ConfirmationResult } from 'firebase/auth';
import { authService } from '@/features/authentication/services/auth-service';
import { useAuthStore } from '@/features/authentication/store/auth-store';
import { AppButton } from '@/shared/components/app-button';
import { FormField } from '@/shared/components/form-field';
import { Screen } from '@/shared/components/screen';
import { firebaseConfig } from '@/shared/services/firebase';

export default function PhoneSignIn() {
  const verifier = useRef<FirebaseRecaptchaVerifierModal>(null);
  const setSession = useAuthStore((state) => state.setSession);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const sendCode = async () => {
    if (!/^\+265\d{9}$/.test(phone.replace(/\s/g, ''))) {
      Alert.alert('Invalid number', 'Use a Malawi number in international format, for example +265991234567.');
      return;
    }
    if (!verifier.current) return;
    setLoading(true);
    try {
      const result = await authService.sendPhoneVerificationCode(phone.replace(/\s/g, ''), verifier.current);
      setConfirmation(result);
      Alert.alert('Code sent', 'Enter the verification code sent by SMS. Standard SMS rates may apply.');
    } catch (error) {
      Alert.alert('Could not send code', (error as Error).message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const confirmCode = async () => {
    if (!confirmation || code.trim().length < 6) return;
    setLoading(true);
    try {
      setSession(await authService.confirmPhoneSignIn(confirmation, code));
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Invalid code', 'Check the SMS code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <FirebaseRecaptchaVerifierModal ref={verifier} firebaseConfig={firebaseConfig} attemptInvisibleVerification />
      <Text className="text-3xl font-extrabold text-ink">Sign in with phone</Text>
      <Text className="mt-2 text-base leading-6 text-slate-500">We’ll send a one-time SMS verification code to your Malawi number.</Text>
      <View className="mt-8 gap-4">
        <FormField label="Malawi phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+265 991 234 567" />
        {confirmation ? <FormField label="SMS verification code" value={code} onChangeText={setCode} keyboardType="number-pad" placeholder="123456" /> : null}
        <AppButton label={confirmation ? 'Verify and sign in' : 'Send SMS code'} loading={loading} onPress={confirmation ? confirmCode : sendCode} />
        {confirmation ? <AppButton label="Send a new code" variant="outline" disabled={loading} onPress={sendCode} /> : null}
        <AppButton label="Back to sign in" variant="outline" disabled={loading} onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
