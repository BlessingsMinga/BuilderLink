import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
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
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const submit = async (input: SignInInput) => {
    try {
      const session = await authService.signIn(input);
      setSession(session);
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Could not sign in', 'Check your email and password, then try again.');
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
              label="Email address"
              value={value}
              onChangeText={onChange}
              autoCapitalize="none"
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
              error={errors.password?.message}
            />
          )}
        />
        <Pressable onPress={() => router.push('/forgot-password')}><Text className="text-right font-semibold text-brand">Forgot password?</Text></Pressable>
        <AppButton label="Sign in" loading={isSubmitting} onPress={handleSubmit(submit)} />
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
