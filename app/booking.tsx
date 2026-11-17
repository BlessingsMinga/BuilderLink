import { router, useLocalSearchParams, type Href } from 'expo-router';
import { CalendarDays, ChevronLeft, MapPin, Wrench } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { useAuthStore } from '@/features/authentication/store/auth-store';
import { useCreateBooking } from '@/features/bookings/hooks/use-bookings';
import { isPastDate, parseBookingDate } from '@/features/bookings/services/booking-service';
import { useBuilder } from '@/features/builders/hooks/use-builders';
import { AppButton } from '@/shared/components/app-button';
import { Protected } from '@/shared/components/protected';
import { Screen } from '@/shared/components/screen';
import { useThemeColors } from '@/shared/theme';

const FALLBACK_SERVICE = 'General construction';

export default function Booking() {
  const colors = useThemeColors();
  const { builderId } = useLocalSearchParams<{ builderId?: string }>();
  const session = useAuthStore((state) => state.session);
  const { data: builder, isLoading, isError, refetch } = useBuilder(builderId);
  const createBooking = useCreateBooking();

  const services = builder?.trades.length ? builder.trades : [FALLBACK_SERVICE];
  const [service, setService] = useState<string | null>(null);
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  // Default to the builder's first trade once their profile has loaded.
  useEffect(() => {
    if (builder && service === null) setService(builder.trades[0] ?? FALLBACK_SERVICE);
  }, [builder, service]);

  const submit = async () => {
    if (!session || !builder) return;
    if (builder.id === session.userId) {
      return Alert.alert('Not available', 'You can’t send a booking request to yourself.');
    }
    const preferredDate = parseBookingDate(date);
    if (!preferredDate) {
      return Alert.alert('Check the date', 'Enter your preferred date as DD/MM/YYYY, for example 04/12/2026.');
    }
    if (isPastDate(preferredDate)) {
      return Alert.alert('Check the date', 'Your preferred date can’t be in the past.');
    }
    if (location.trim().length < 3 || description.trim().length < 10) {
      return Alert.alert('Complete your request', 'Add a job location and a short description of the work (at least 10 characters).');
    }

    try {
      await createBooking.mutateAsync({
        customerId: session.userId,
        builderId: builder.id,
        builderName: builder.name,
        service: service ?? services[0],
        preferredDate,
        location,
        description,
      });
      Alert.alert('Request sent', `${builder.name} can now accept or decline your booking.`, [
        { text: 'View my bookings', onPress: () => router.replace('/bookings' as Href) },
      ]);
    } catch (error) {
      console.warn('Booking request failed:', error);
      Alert.alert('Could not send request', 'We couldn’t send your booking request. Check your connection and try again.');
    }
  };

  return (
    <Protected>
      <Screen>
        <Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface">
          <ChevronLeft color={colors.ink} />
        </Pressable>
        <Text className="mt-6 text-3xl font-bold text-ink">Request a booking</Text>

        {!builderId ? (
          <View className="mt-10 items-center gap-4 rounded-2xl border border-line bg-surface p-6">
            <Text className="text-center text-base text-muted">Choose a professional first, then request a booking from their profile.</Text>
            <Pressable onPress={() => router.replace('/(tabs)/search')} className="rounded-xl bg-ink px-6 py-3">
              <Text className="font-bold text-canvas">Find a professional</Text>
            </Pressable>
          </View>
        ) : isLoading ? (
          <View className="mt-16 items-center gap-3">
            <ActivityIndicator size="large" color={colors.ink} />
            <Text className="text-muted">Loading…</Text>
          </View>
        ) : isError || !builder ? (
          <View className="mt-10 items-center gap-4 rounded-2xl border border-line bg-surface p-6">
            <Text className="text-base text-muted">We couldn’t load this professional.</Text>
            <Pressable onPress={() => refetch()} className="rounded-xl bg-ink px-6 py-3">
              <Text className="font-bold text-canvas">Try again</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text className="mt-2 text-muted">Send the details to {builder.name}.</Text>

            <Section icon={<Wrench size={19} color={colors.brand} />} title="Service">
              <View className="mt-3 flex-row flex-wrap gap-2">
                {services.map((item) => {
                  const selected = (service ?? services[0]) === item;
                  return (
                    <Pressable key={item} onPress={() => setService(item)} className={`rounded-xl border px-3 py-2 ${selected ? 'border-ink bg-ink' : 'border-line bg-surface'}`}>
                      <Text className={`font-semibold ${selected ? 'text-canvas' : 'text-ink'}`}>{item}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Section>

            <Section icon={<CalendarDays size={19} color={colors.brand} />} title="Preferred date">
              <TextInput placeholderTextColor={colors.faint} value={date} onChangeText={setDate} className="mt-3 h-14 rounded-xl border border-line bg-surface px-4 text-base text-ink" placeholder="DD/MM/YYYY" keyboardType="numbers-and-punctuation" maxLength={10} />
            </Section>

            <Section icon={<MapPin size={19} color={colors.brand} />} title="Job location">
              <TextInput placeholderTextColor={colors.faint} value={location} onChangeText={setLocation} className="mt-3 h-14 rounded-xl border border-line bg-surface px-4 text-base text-ink" placeholder="Area, district and nearest landmark" maxLength={200} />
            </Section>

            <Section title="Describe the work">
              <TextInput placeholderTextColor={colors.faint} value={description} onChangeText={setDescription} multiline textAlignVertical="top" className="mt-3 h-32 rounded-xl border border-line bg-surface px-4 pt-4 text-base text-ink" placeholder="What needs to be done? Include dimensions or materials if you know them." maxLength={1000} />
            </Section>

            <View className="mt-8 rounded-xl bg-subtle p-4">
              <Text className="font-bold text-ink">What happens next</Text>
              <Text className="mt-1 leading-5 text-muted">The builder reviews your request and accepts or declines it. You can follow its status under My bookings.</Text>
            </View>

            <View className="my-7">
              <AppButton label="Send booking request" loading={createBooking.isPending} onPress={submit} />
            </View>
          </>
        )}
      </Screen>
    </Protected>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <View className="mt-7">
      <View className="flex-row items-center gap-2">
        {icon}
        <Text className="text-lg font-bold text-ink">{title}</Text>
      </View>
      {children}
    </View>
  );
}
