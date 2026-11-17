import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { useAuthStore } from '@/features/authentication/store/auth-store';
import { DateField } from '@/features/bookings/components/date-field';
import { useCreateBooking } from '@/features/bookings/hooks/use-bookings';
import { useBuilder } from '@/features/builders/hooks/use-builders';
import { MALAWI_DISTRICTS } from '@/features/builders/services/builder-service';
import { AppButton } from '@/shared/components/app-button';
import { Chip } from '@/shared/components/chip';
import { FormField } from '@/shared/components/form-field';
import { Protected } from '@/shared/components/protected';
import { Screen } from '@/shared/components/screen';
import { ScreenHeader } from '@/shared/components/screen-header';
import { Skeleton } from '@/shared/components/skeleton';
import { EmptyState, ErrorState, ErrorText, isOfflineError } from '@/shared/components/states';

const FALLBACK_SERVICE = 'General construction';
const MIN_DESCRIPTION_LENGTH = 10;

export default function Booking() {
  const { builderId } = useLocalSearchParams<{ builderId?: string }>();
  const session = useAuthStore((state) => state.session);
  const { data: builder, isLoading, isError, error, refetch } = useBuilder(builderId);
  const createBooking = useCreateBooking();

  const services = builder?.trades.length ? builder.trades : [FALLBACK_SERVICE];
  const [chosenService, setChosenService] = useState<string | null>(null);
  // Until the customer picks one, the builder's first trade is selected.
  const service = chosenService ?? services[0];
  const [date, setDate] = useState<string | null>(null);
  const [district, setDistrict] = useState<string | null>(null);
  const [landmark, setLandmark] = useState('');
  const [description, setDescription] = useState('');
  // Field errors stay hidden until the first attempt to send.
  const [attempted, setAttempted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isOwnProfile = Boolean(builder && builder.id === session?.userId);
  const errors = {
    date: date ? null : 'Choose your preferred date.',
    location: !district
      ? 'Choose the district where the work is.'
      : landmark.trim().length < 3
        ? 'Add the area or nearest landmark.'
        : null,
    description:
      description.trim().length < MIN_DESCRIPTION_LENGTH
        ? `Describe the work in at least ${MIN_DESCRIPTION_LENGTH} characters.`
        : null,
  };
  const shown = attempted ? errors : { date: null, location: null, description: null };

  const submit = async () => {
    setAttempted(true);
    setSubmitError(null);
    if (!session || !builder || !date || !district || errors.location || errors.description) return;
    try {
      await createBooking.mutateAsync({
        customerId: session.userId,
        builderId: builder.id,
        builderName: builder.name,
        service,
        preferredDate: date,
        location: `${landmark.trim()}, ${district}`,
        description,
      });
      router.replace('/(tabs)/bookings' as never);
    } catch (failure) {
      console.warn('Booking request failed:', failure);
      setSubmitError(
        isOfflineError(failure)
          ? 'You’re offline. Reconnect and send your request again.'
          : 'We couldn’t send your request. Please try again.',
      );
    }
  };

  const canShowForm = Boolean(builder) && !isOwnProfile;

  return (
    <Protected>
      <Screen
        header={<ScreenHeader title="Request a booking" />}
        footer={
          canShowForm ? (
            <View>
              <ErrorText>{submitError}</ErrorText>
              <View className={submitError ? 'mt-3' : ''}>
                <AppButton label="Send booking request" loading={createBooking.isPending} onPress={submit} />
              </View>
            </View>
          ) : undefined
        }
      >
        {!builderId ? (
          <EmptyState
            message="Choose a professional first, then request a booking from their profile."
            actionLabel="Find a professional"
            onAction={() => router.replace('/(tabs)/search')}
          />
        ) : isLoading ? (
          <View accessibilityLabel="Loading" className="gap-4">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-28 w-full" />
          </View>
        ) : isError ? (
          <ErrorState error={error} what="this professional" onRetry={() => refetch()} />
        ) : !builder ? (
          <EmptyState message="This professional isn’t available for bookings." />
        ) : isOwnProfile ? (
          <EmptyState message="You can’t send a booking request to yourself." />
        ) : (
          <>
            <Text className="font-body text-base text-muted">
              {builder.name} will accept or decline. You can follow the request under Bookings.
            </Text>

            <Step number={1} title="Service">
              <View className="flex-row flex-wrap gap-2">
                {services.map((item) => (
                  <Chip key={item} label={item} selected={service === item} onPress={() => setChosenService(item)} />
                ))}
              </View>
            </Step>

            <Step number={2} title="Preferred date">
              <DateField value={date} onChange={setDate} />
              <ErrorText>{shown.date}</ErrorText>
            </Step>

            <Step number={3} title="Location">
              <View className="flex-row flex-wrap gap-2">
                {MALAWI_DISTRICTS.map((item) => (
                  <Chip key={item} label={item} selected={district === item} onPress={() => setDistrict(item)} />
                ))}
              </View>
              <View className="mt-4">
                <FormField
                  label="Area or nearest landmark"
                  value={landmark}
                  onChangeText={setLandmark}
                  placeholder="e.g. Area 25, near the market"
                  maxLength={150}
                />
              </View>
              <ErrorText>{shown.location}</ErrorText>
            </Step>

            <Step number={4} title="Describe the work">
              <FormField
                label="What needs to be done?"
                value={description}
                onChangeText={setDescription}
                multiline
                placeholder="Include dimensions or materials if you know them."
                maxLength={1000}
                error={shown.description}
              />
            </Step>
          </>
        )}
      </Screen>
    </Protected>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <View className="mt-8">
      <View className="mb-3 flex-row items-center gap-3">
        <View className="h-6 w-6 items-center justify-center rounded-full bg-subtle">
          <Text className="font-semibold text-xs text-muted">{number}</Text>
        </View>
        <Text className="font-heading-semibold text-lg text-ink">{title}</Text>
      </View>
      {children}
    </View>
  );
}
