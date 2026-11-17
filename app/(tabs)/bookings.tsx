import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useAuthStore } from '@/features/authentication/store/auth-store';
import { BookingCard } from '@/features/bookings/components/booking-card';
import { useBookings } from '@/features/bookings/hooks/use-bookings';
import { groupBookings, type Booking, type BookingPerspective } from '@/features/bookings/services/booking-service';
import { useReviewedBookingIds } from '@/features/reviews/hooks/use-reviews';
import { Screen } from '@/shared/components/screen';
import { ListSkeleton } from '@/shared/components/skeleton';
import { EmptyState, ErrorState } from '@/shared/components/states';

export default function Bookings() {
  const session = useAuthStore((state) => state.session);
  const isBuilder = session?.role === 'builder';
  const [perspective, setPerspective] = useState<BookingPerspective>(isBuilder ? 'builder' : 'customer');
  const { data: bookings = [], isLoading, isError, error, refetch, isRefetching } = useBookings(session?.userId, perspective);
  const reviewed = useReviewedBookingIds(session?.userId);

  const groups = groupBookings(bookings, perspective, reviewed.data);
  const needsActionHint = perspective === 'builder' ? 'Respond to this request' : 'Leave a review';

  return (
    <Screen
      refreshing={isRefetching}
      onRefresh={() => {
        refetch();
        reviewed.refetch();
      }}
    >
      <Text className="font-heading text-3xl text-ink">Bookings</Text>

      {isBuilder ? (
        <View className="mt-5 flex-row rounded-xl bg-subtle p-1">
          <Segment label="Requests to me" active={perspective === 'builder'} onPress={() => setPerspective('builder')} />
          <Segment label="Sent by me" active={perspective === 'customer'} onPress={() => setPerspective('customer')} />
        </View>
      ) : null}

      {isLoading ? (
        <View className="mt-8">
          <ListSkeleton />
        </View>
      ) : isError ? (
        <View className="mt-8">
          <ErrorState error={error} what="your bookings" onRetry={() => refetch()} />
        </View>
      ) : bookings.length === 0 ? (
        <View className="mt-8">
          {perspective === 'builder' ? (
            <EmptyState message="No booking requests yet. New requests from customers appear here." />
          ) : (
            <EmptyState
              message="You haven’t requested any bookings yet."
              actionLabel="Find a professional"
              onAction={() => router.push('/(tabs)/search')}
            />
          )}
        </View>
      ) : (
        <>
          <Group title="Needs action" bookings={groups.needsAction} perspective={perspective} hint={needsActionHint} />
          <Group title="Upcoming" bookings={groups.upcoming} perspective={perspective} />
          <Group title="Past" bookings={groups.past} perspective={perspective} />
        </>
      )}
    </Screen>
  );
}

function Group({ title, bookings, perspective, hint }: { title: string; bookings: Booking[]; perspective: BookingPerspective; hint?: string }) {
  if (bookings.length === 0) return null;
  return (
    <View className="mt-8">
      <Text className="mb-3 font-heading-semibold text-lg text-ink">{title}</Text>
      <View className="gap-3">
        {bookings.map((booking) => (
          <BookingCard key={booking.id} booking={booking} perspective={perspective} hint={hint} />
        ))}
      </View>
    </View>
  );
}

function Segment({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      className={`h-11 flex-1 items-center justify-center rounded-lg ${active ? 'bg-surface' : ''}`}
    >
      <Text className={`text-sm ${active ? 'font-semibold text-ink' : 'font-medium text-muted'}`}>{label}</Text>
    </Pressable>
  );
}
