import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, Text, View } from 'react-native';
import { GoogleSignInButton, isGoogleAuthConfigured } from '@/features/authentication/components/google-sign-in-button';
import { signInSchema, type SignInInput } from '@/features/authentication/schemas/auth-schemas';
import { authService } from '@/features/authentication/services/auth-service';
import { useAuthStore } from '@/features/authentication/store/auth-store';
import { AppButton } from '@/shared/components/app-button';
import { BrandMark } from '@/shared/components/brand-mark';
import { FormField } from '@/shared/components/form-field';
import { Screen } from '@/shared/components/screen';
import { ErrorText, isOfflineError } from '@/shared/components/states';

export default function Login() {
  const setSession = useAuthStore((state) => state.setSession);
  // Phone and Google come first; the email form opens on request.
  const [useEmail, setUseEmail] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const submit = async (input: SignInInput) => {
    setSignInError(null);
    try {
      const session = await authService.signIn(input);
      setSession(session);
      router.replace('/(tabs)');
    } catch (failure) {
      setSignInError(
        isOfflineError(failure)
          ? 'You’re offline. Reconnect and try again.'
          : 'We couldn’t sign you in. Check your email and password, then try again.',
      );
    }
  };

  return (
    <Screen>
      <View className="flex-row items-center gap-3 pt-4">
        <BrandMark />
        <Text className="font-heading text-xl text-ink">BuilderLink</Text>
      </View>
      <Text accessibilityRole="header" className="mt-10 font-heading text-3xl text-ink">
        Welcome back
      </Text>
      <Text className="mt-2 font-body text-base text-muted">Log in to find professionals and manage your bookings.</Text>

      <View className="mt-8 gap-3">
        <AppButton label="Continue with phone" onPress={() => router.push('/phone-sign-in' as never)} />
        {isGoogleAuthConfigured ? <GoogleSignInButton onSuccess={() => router.replace('/(tabs)')} /> : null}
      </View>
      {!useEmail ? null : (
        <View className="mt-6 flex-row items-center gap-3">
          <View className="h-px flex-1 bg-line" />
          <Text className="font-body text-sm text-muted">or with email</Text>
          <View className="h-px flex-1 bg-line" />
        </View>
      )}

      {useEmail ? (
        <View className="mt-6 gap-4">
          <Controller
            control={control}
            name="identifier"
            render={({ field: { onChange, value } }) => (
              <FormField
                label="Email"
                value={value}
                onChangeText={onChange}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                error={errors.identifier?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <FormField
                label="Password"
                value={value}
                onChangeText={onChange}
                secureTextEntry
                autoComplete="password"
                error={errors.password?.message}
              />
            )}
          />
          <Pressable hitSlop={12} onPress={() => router.push('/forgot-password')} className="self-end">
            <Text className="font-semibold text-sm text-brand">Forgot password?</Text>
          </Pressable>
          <View>
            <ErrorText>{signInError}</ErrorText>
            <View className={signInError ? 'mt-3' : ''}>
              <AppButton label="Log in with email" variant="outline" loading={isSubmitting} onPress={handleSubmit(submit)} />
            </View>
          </View>
        </View>
      ) : (
        <Pressable onPress={() => setUseEmail(true)} className="mt-4 h-12 items-center justify-center">
          <Text className="font-semibold text-base text-brand">Use email instead</Text>
        </Pressable>
      )}

      <Text className="mt-8 text-center font-body text-base text-muted">
        New to BuilderLink?{' '}
        <Text accessibilityRole="link" className="font-semibold text-brand" onPress={() => router.push('/register')}>
          Create an account
        </Text>
      </Text>
    </Screen>
  );
}
