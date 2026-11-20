import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Text, View } from 'react-native';
import { GoogleSignInButton, isGoogleAuthConfigured } from '@/features/authentication/components/google-sign-in-button';
import { registrationSchema, type RegistrationInput } from '@/features/authentication/schemas/auth-schemas';
import { authService } from '@/features/authentication/services/auth-service';
import { useAuthStore } from '@/features/authentication/store/auth-store';
import { AppButton } from '@/shared/components/app-button';
import { FormField } from '@/shared/components/form-field';
import { Screen } from '@/shared/components/screen';
import { ScreenHeader } from '@/shared/components/screen-header';

/** Builders go on to their profile and ID check after this, so they see three steps. */
const BUILDER_STEPS = 3;
/** Malawi only: the phone field shows this in a fixed box. */
const COUNTRY_CODE = '+265';

export default function RegisterRole() {
  const { role } = useLocalSearchParams<{ role: 'customer' | 'builder' }>();
  const isBuilder = role === 'builder';
  const setSession = useAuthStore((state) => state.setSession);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationInput>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      email: '',
      password: '',
      ...(isBuilder ? { businessName: '', trade: '' } : {}),
    },
  });

  const submit = async (input: RegistrationInput) => {
    try {
      const session = await authService.register(input, isBuilder ? 'builder' : 'customer');
      setSession(session);
      router.replace({ pathname: '/verify-email', params: { email: input.email } });
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === 'auth/email-already-in-use') {
        setError('email', { message: 'An account already exists for this email. Log in instead.' });
        return;
      }
      Alert.alert('Could not create account', 'Please check your connection and try again.');
    }
  };

  return (
    <Screen
      header={<ScreenHeader />}
      footer={
        <View className="gap-3">
          <AppButton label="Create account" loading={isSubmitting} onPress={handleSubmit(submit)} />
          <Text className="text-center font-body text-xs text-muted">
            By continuing you agree to BuilderLink’s Terms and Privacy Policy.
          </Text>
        </View>
      }
    >
      {isBuilder ? (
        <View accessibilityLabel={`Step 1 of ${BUILDER_STEPS}: your account`} className="mb-6">
          <Text className="font-semibold text-sm text-muted">Step 1 of {BUILDER_STEPS} · Your account</Text>
          <View className="mt-2 flex-row gap-1.5">
            {Array.from({ length: BUILDER_STEPS }, (_, index) => (
              <View key={index} className={`h-1.5 flex-1 rounded-full ${index === 0 ? 'bg-primary' : 'bg-line'}`} />
            ))}
          </View>
        </View>
      ) : null}

      <Text accessibilityRole="header" className="font-heading text-3xl text-ink">
        {isBuilder ? 'Create your builder account' : 'Create your account'}
      </Text>
      <Text className="mt-2 font-body text-base leading-6 text-muted">
        {isBuilder
          ? 'Next you’ll add your trades and work photos, then verify your ID.'
          : 'Find trusted professionals for your next project.'}
      </Text>

      {isGoogleAuthConfigured ? (
        <>
          <View className="mt-6">
            <GoogleSignInButton role={isBuilder ? 'builder' : 'customer'} onSuccess={() => router.replace('/(tabs)')} />
          </View>
          <View className="mt-5 flex-row items-center gap-3">
            <View className="h-px flex-1 bg-line" />
            <Text className="font-body text-sm text-muted">or with email</Text>
            <View className="h-px flex-1 bg-line" />
          </View>
        </>
      ) : null}

      <View className="mt-6 gap-4">
        <Controller
          control={control}
          name="fullName"
          render={({ field: { onChange, value } }) => (
            <FormField label="Full name" value={value} onChangeText={onChange} autoComplete="name" error={errors.fullName?.message} />
          )}
        />
        {isBuilder ? (
          <>
            <Controller
              control={control}
              name="businessName"
              render={({ field: { onChange, value } }) => (
                <FormField label="Business or professional name" value={value ?? ''} onChangeText={onChange} error={errors.businessName?.message} />
              )}
            />
            <Controller
              control={control}
              name="trade"
              render={({ field: { onChange, value } }) => (
                <FormField label="Primary trade" value={value ?? ''} onChangeText={onChange} placeholder="e.g. Bricklayer" error={errors.trade?.message} />
              )}
            />
          </>
        ) : null}
        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, value } }) => (
            <FormField
              label="Phone number"
              prefix={COUNTRY_CODE}
              value={value.replace(COUNTRY_CODE, '')}
              // Stored as +265 and the digits, with spaces and a leading 0 removed.
              onChangeText={(text) => onChange(text ? COUNTRY_CODE + text.replace(/\D/g, '').replace(/^0/, '') : '')}
              keyboardType="phone-pad"
              autoComplete="tel-national"
              placeholder="991 234 567"
              error={errors.phone?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <FormField
              label="Email"
              value={value}
              onChangeText={onChange}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="you@example.com"
              error={errors.email?.message}
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
              autoComplete="new-password"
              placeholder="At least 8 characters"
              error={errors.password?.message}
            />
          )}
        />
      </View>
    </Screen>
  );
}
