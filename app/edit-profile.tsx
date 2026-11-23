import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { ProfilePhotoPicker } from '@/features/authentication/components/profile-photo-picker';
import { useProfile, useSaveProfile } from '@/features/authentication/hooks/use-profile';
import { useAuthStore } from '@/features/authentication/store/auth-store';
import { MALAWI_DISTRICTS } from '@/features/builders/services/builder-service';
import { AppButton } from '@/shared/components/app-button';
import { Chip } from '@/shared/components/chip';
import { FormField } from '@/shared/components/form-field';
import { Protected } from '@/shared/components/protected';
import { Screen } from '@/shared/components/screen';
import { ScreenHeader } from '@/shared/components/screen-header';
import { Skeleton } from '@/shared/components/skeleton';
import { ErrorState, ErrorText, isOfflineError } from '@/shared/components/states';
import { toast } from '@/shared/components/toast';

/** Edit your photo, name and contact details. Builders continue to their work details. */
export default function EditProfile() {
  const session = useAuthStore((state) => state.session);
  const profile = useProfile(session?.userId);
  const save = useSaveProfile(session?.userId);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (hydrated || !profile.data) return;
    setFullName(profile.data.fullName);
    setPhone(profile.data.phone ?? '');
    setDistrict(profile.data.district);
    setHydrated(true);
  }, [hydrated, profile.data]);

  const phoneDigits = phone.replace(/[\s-]/g, '');
  const errors = {
    fullName: fullName.trim().length < 2 ? 'Enter your full name.' : null,
    phone: phoneDigits && !/^\+?[0-9]{7,15}$/.test(phoneDigits) ? 'Enter a valid phone number, e.g. +265 991 234 567.' : null,
  };
  const shown = attempted ? errors : { fullName: null, phone: null };
  const isBuilder = session?.role === 'builder';

  const submit = async () => {
    setAttempted(true);
    setSaveError(null);
    if (errors.fullName || errors.phone) return;
    try {
      await save.mutateAsync({ fullName, phone: phoneDigits || null, district });
      toast.success('Profile updated.');
      router.back();
    } catch (failure) {
      console.warn('Saving profile failed:', failure);
      setSaveError(isOfflineError(failure) ? 'You’re offline. Reconnect and save again.' : 'We couldn’t save your profile. Please try again.');
    }
  };

  return (
    <Protected>
      <Screen
        header={<ScreenHeader title="Edit profile" />}
        footer={
          hydrated ? (
            <View>
              <ErrorText>{saveError}</ErrorText>
              <View className={saveError ? 'mt-3' : ''}>
                <AppButton label="Save changes" loading={save.isPending} onPress={submit} />
              </View>
            </View>
          ) : undefined
        }
      >
        {profile.isError ? (
          <ErrorState error={profile.error} what="your profile" onRetry={() => profile.refetch()} />
        ) : !hydrated || !session ? (
          <View accessibilityLabel="Loading" className="gap-4">
            <Skeleton className="h-24 w-24 self-center rounded-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </View>
        ) : (
          <View className="gap-5">
            <ProfilePhotoPicker userId={session.userId} name={fullName || profile.data?.fullName || ''} shape={isBuilder ? 'tile' : 'circle'} />
            <FormField label="Full name" value={fullName} onChangeText={setFullName} maxLength={100} autoComplete="name" error={shown.fullName} />
            <FormField
              label="Phone number (optional)"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
              placeholder="+265 991 234 567"
              maxLength={20}
              error={shown.phone}
            />
            <View>
              <Text className="mb-2 font-semibold text-sm text-ink">Your district</Text>
              <View className="flex-row flex-wrap gap-2">
                {MALAWI_DISTRICTS.map((item) => (
                  <Chip key={item} label={item} selected={district === item} onPress={() => setDistrict(district === item ? null : item)} />
                ))}
              </View>
            </View>
            {isBuilder ? (
              <View className="rounded-2xl bg-subtle p-4">
                <Text className="font-semibold text-base text-ink">Your work profile</Text>
                <Text className="mt-1 font-body text-sm text-muted">
                  Add your bio, skills, areas you serve, prices, qualifications and work photos.
                </Text>
                <Text className="mt-2 font-bold text-sm text-brand" onPress={() => router.push('/builder-profile')}>
                  Open builder workspace →
                </Text>
              </View>
            ) : null}
          </View>
        )}
      </Screen>
    </Protected>
  );
}
