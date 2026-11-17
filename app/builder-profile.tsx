import { CheckCircle2, Circle } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useProfile } from '@/features/authentication/hooks/use-profile';
import { useAuthStore } from '@/features/authentication/store/auth-store';
import { useOwnBuilder, useSaveOwnBuilder } from '@/features/builders/hooks/use-builders';
import { MALAWI_DISTRICTS, TRADES, type VerificationStatus } from '@/features/builders/services/builder-service';
import { AppButton } from '@/shared/components/app-button';
import { Chip } from '@/shared/components/chip';
import { FormField } from '@/shared/components/form-field';
import { Protected } from '@/shared/components/protected';
import { Screen } from '@/shared/components/screen';
import { ScreenHeader } from '@/shared/components/screen-header';
import { Skeleton } from '@/shared/components/skeleton';
import { ErrorState, ErrorText, isOfflineError } from '@/shared/components/states';
import { useThemeColors } from '@/shared/theme';
import { DocumentsManager, PortfolioManager } from '@/features/portfolio/components/portfolio-manager';
import { toast } from '@/shared/components/toast';

const MAX_TRADES = 12;

const statusBanners: Record<VerificationStatus | 'new', { title: string; text: string; tone: string }> = {
  new: {
    title: 'Not submitted yet',
    text: 'Complete both steps and save to submit your profile for verification.',
    tone: 'bg-subtle',
  },
  pending: {
    title: 'Under review',
    text: 'Customers will be able to find and book you once your profile is verified.',
    tone: 'bg-warn-soft',
  },
  verified: {
    title: 'Verified',
    text: 'Your profile is live. Customers can find you and send booking requests.',
    tone: 'bg-success-soft',
  },
  rejected: {
    title: 'Not approved',
    text: 'Update your details and save to submit your profile again.',
    tone: 'bg-danger-soft',
  },
};

export default function BuilderProfile() {
  const session = useAuthStore((state) => state.session);
  const profile = useProfile(session?.userId);
  const listing = useOwnBuilder(session?.userId);
  const save = useSaveOwnBuilder(session?.userId);

  const [businessName, setBusinessName] = useState('');
  const [years, setYears] = useState('');
  const [district, setDistrict] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [trades, setTrades] = useState<string[]>([]);
  const [attempted, setAttempted] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Fill the form once from the saved listing.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    if (hydrated || listing.isLoading || listing.isError) return;
    if (listing.data) {
      setBusinessName(listing.data.businessName);
      setYears(String(listing.data.yearsExperience));
      setDistrict(listing.data.district);
      setBio(listing.data.bio);
      setTrades(listing.data.trades);
    }
    setHydrated(true);
  }, [hydrated, listing.data, listing.isLoading, listing.isError]);

  const yearsNumber = Number(years);
  const errors = {
    businessName: businessName.trim().length < 2 ? 'Enter your business or professional name.' : null,
    years: years.trim() === '' || !Number.isInteger(yearsNumber) || yearsNumber < 0 || yearsNumber > 70 ? 'Enter your years of experience as a whole number.' : null,
    district: district ? null : 'Choose the district you work in.',
    trades: trades.length === 0 ? 'Choose at least one skill.' : null,
  };
  const detailsDone = !errors.businessName && !errors.years && !errors.district;
  const skillsDone = !errors.trades;
  const shown = attempted ? errors : { businessName: null, years: null, district: null, trades: null };

  // Trades saved earlier that aren't in the standard list stay selectable.
  const tradeOptions = [...TRADES, ...trades.filter((trade) => !(TRADES as readonly string[]).includes(trade))];
  const toggleTrade = (trade: string) => {
    setSaved(false);
    setTrades((current) =>
      current.includes(trade) ? current.filter((item) => item !== trade) : current.length < MAX_TRADES ? [...current, trade] : current,
    );
  };
  // Any edit clears the "saved" confirmation.
  const edit = <T,>(setter: (value: T) => void) => (value: T) => {
    setSaved(false);
    setter(value);
  };

  const submit = async () => {
    setAttempted(true);
    setSaveError(null);
    if (!session || !detailsDone || !skillsDone) return;
    try {
      await save.mutateAsync({
        displayName: profile.data?.fullName ?? businessName.trim(),
        input: { businessName, bio, yearsExperience: yearsNumber, trades, district },
      });
      setSaved(true);
      toast.success(listing.data ? 'Profile saved.' : 'Profile submitted. We’ll review it shortly.');
    } catch (failure) {
      console.warn('Saving builder profile failed:', failure);
      setSaveError(
        isOfflineError(failure) ? 'You’re offline. Reconnect and save again.' : 'We couldn’t save your profile. Please try again.',
      );
    }
  };

  const banner = statusBanners[listing.data?.verificationStatus ?? 'new'];
  const ready = hydrated && !listing.isError;

  return (
    <Protected roles={['builder']}>
      <Screen
        header={<ScreenHeader title="Builder workspace" />}
        footer={
          ready ? (
            <View>
              <ErrorText>{saveError}</ErrorText>
              {saved ? <Text className="font-medium text-sm text-success">Profile saved.</Text> : null}
              <View className={saveError || saved ? 'mt-3' : ''}>
                <AppButton label={listing.data ? 'Save profile' : 'Submit for verification'} loading={save.isPending} onPress={submit} />
              </View>
            </View>
          ) : undefined
        }
      >
        {listing.isError ? (
          <ErrorState error={listing.error} what="your builder profile" onRetry={() => listing.refetch()} />
        ) : !hydrated ? (
          <View accessibilityLabel="Loading" className="gap-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-28 w-full" />
          </View>
        ) : (
          <>
            <View className={`rounded-2xl p-4 ${banner.tone}`}>
              <Text className="font-semibold text-base text-ink">{banner.title}</Text>
              <Text className="mt-1 font-body text-sm text-muted">{banner.text}</Text>
              {listing.data?.verificationStatus === 'rejected' && listing.data.rejectionReason ? (
                <Text className="mt-2 font-medium text-sm text-ink">Reviewer’s note: “{listing.data.rejectionReason}”</Text>
              ) : null}
            </View>

            <Step title="Your details" done={detailsDone}>
              <View className="gap-4">
                <FormField
                  label="Business or professional name"
                  value={businessName}
                  onChangeText={edit(setBusinessName)}
                  placeholder="e.g. Mbewe Building Services"
                  maxLength={100}
                  error={shown.businessName}
                />
                <FormField
                  label="Years of experience"
                  value={years}
                  onChangeText={edit(setYears)}
                  keyboardType="number-pad"
                  placeholder="e.g. 8"
                  maxLength={2}
                  error={shown.years}
                />
                <View>
                  <Text className="mb-2 font-medium text-sm text-ink">District</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {MALAWI_DISTRICTS.map((item) => (
                      <Chip key={item} label={item} selected={district === item} onPress={() => edit(setDistrict)(item)} />
                    ))}
                  </View>
                  <ErrorText>{shown.district}</ErrorText>
                </View>
                <FormField
                  label="About your work (optional)"
                  value={bio}
                  onChangeText={edit(setBio)}
                  multiline
                  placeholder="Tell customers about the work you do."
                  maxLength={1000}
                />
              </View>
            </Step>

            <Step title="Your skills" done={skillsDone}>
              <View className="flex-row flex-wrap gap-2">
                {tradeOptions.map((trade) => (
                  <Chip key={trade} label={trade} selected={trades.includes(trade)} onPress={() => toggleTrade(trade)} />
                ))}
              </View>
              <ErrorText>{shown.trades}</ErrorText>
            </Step>

            {listing.data && session ? (
              <>
                <Step title="Work photos" done={false} optional>
                  <PortfolioManager builderId={session.userId} />
                </Step>
                <Step title="ID and certificates" done={false} optional>
                  <DocumentsManager builderId={session.userId} />
                </Step>
              </>
            ) : (
              <Text className="mt-8 font-body text-sm text-muted">
                After you submit, you can add work photos and upload your ID here.
              </Text>
            )}
          </>
        )}
      </Screen>
    </Protected>
  );
}

/** One checklist step: a tick once its fields are complete. */
function Step({ title, done, optional = false, children }: { title: string; done: boolean; optional?: boolean; children: React.ReactNode }) {
  const colors = useThemeColors();
  return (
    <View className="mt-8">
      <View className="mb-3 flex-row items-center gap-2">
        {optional ? null : done ? <CheckCircle2 size={20} color={colors.success} /> : <Circle size={20} color={colors.faint} />}
        <Text className="font-heading-semibold text-lg text-ink">{title}</Text>
      </View>
      {children}
    </View>
  );
}
