import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Pressable, Text, View } from 'react-native';
import { signInSchema, type SignInInput } from '@/features/authentication/schemas/auth-schemas';
import { authService } from '@/features/authentication/services/auth-service';
import { useAuthStore } from '@/features/authentication/store/auth-store';
import { AppButton } from '@/shared/components/app-button';
import { BrandMark } from '@/shared/components/brand-mark';
import { FormField } from '@/shared/components/form-field';
import { Screen } from '@/shared/components/screen';

export default function Login() {
  const setSession = useAuthStore((state) => state.setSession);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [phoneMode, setPhoneMode] = useState(false);
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const submit = async (input: SignInInput) => {
    const session = await authService.signIn(input);
    setSession(session);
    router.replace('/(tabs)');
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      const session = await authService.signInWithGoogle();
      setSession(session);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Google Sign-In Failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handlePhoneSignIn = async (input: SignInInput) => {
    try {
      const session = await authService.signInWithPhone(input.identifier, input.password);
      setSession(session);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Phone Sign-In Failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <Screen>
      <BrandMark />
      <Text className="mt-8 text-3xl font-extrabold text-ink">Welcome back</Text>
      <Text className="mt-2 text-base text-slate-500">Sign in to manage your construction projects.</Text>

      <View className="mt-9 gap-4">
        <Controller
          control={control}
          name="identifier"
          render={({ field: { onChange, value } }) => (
            <FormField
              label={phoneMode ? 'Phone number' : 'Email or phone number'}
              value={value}
              onChangeText={onChange}
              autoCapitalize="none"
              keyboardType={phoneMode ? 'phone-pad' : 'email-address'}
              placeholder={phoneMode ? '+265 991 234 567' : undefined}
              error={errors.identifier?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <FormField
              label={phoneMode ? 'Verification code' : 'Password'}
              value={value}
              onChangeText={onChange}
              secureTextEntry={!phoneMode}
              keyboardType={phoneMode ? 'number-pad' : 'default'}
              error={errors.password?.message}
            />
          )}
        />
        {!phoneMode && (
          <Pressable onPress={() => router.push('/forgot-password')}>
            <Text className="text-right font-semibold text-brand">Forgot password?</Text>
          </Pressable>
        )}
        <AppButton
          label={phoneMode ? 'Sign in with phone' : 'Sign in'}
          loading={isSubmitting}
          onPress={handleSubmit(phoneMode ? handlePhoneSignIn : submit)}
        />
        <Pressable onPress={() => setPhoneMode((prev) => !prev)}>
          <Text className="text-center font-semibold text-brand">
            {phoneMode ? 'Use email instead' : 'Use phone number instead'}
          </Text>
        </Pressable>
      </View>

      <View className="mt-6 flex-row items-center gap-3">
        <View className="h-px flex-1 bg-slate-200" />
        <Text className="text-sm text-slate-400">or</Text>
        <View className="h-px flex-1 bg-slate-200" />
      </View>

      <View className="mt-6">
        <AppButton label="Continue with Google" variant="outline" loading={googleLoading} onPress={handleGoogleSignIn} />
      </View>

      <Text className="mt-8 text-center text-slate-500">
        New to BuilderLink?{' '}
        <Text className="font-bold text-brand" onPress={() => router.push('/register')}>
          Create an account
        </Text>
      </Text>
    </Screen>
  );
}