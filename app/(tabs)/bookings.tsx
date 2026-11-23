import { router } from 'expo-router';
import { CalendarDays, Inbox } from 'lucide-react-native';
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
import { useThemeColors } from '@/shared/theme';

export default function Bookings() {
  const colors = useThemeColors();
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
      hero={
        <>
          <Text accessibilityRole="header" className="font-heading text-[34px] leading-[38px] tracking-tight text-ink">
            Bookings
          </Text>
          {isBuilder ? (
            <View className="mt-5 flex-row rounded-2xl border border-line bg-subtle p-1">
              <Segment label="Requests to me" active={perspective === 'builder'} onPress={() => setPerspective('builder')} />
              <Segment label="Sent by me" active={perspective === 'customer'} onPress={() => setPerspective('customer')} />
            </View>
          ) : (
            <Text className="mt-1 font-medium text-sm text-muted">Track your requests and jobs.</Text>
          )}
        </>
      }
    >
      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState error={error} what="your bookings" onRetry={() => refetch()} />
      ) : bookings.length === 0 ? (
        perspective === 'builder' ? (
          <EmptyState
            icon={<Inbox size={26} color={colors.brand} />}
            message="No booking requests yet. New requests from customers appear here."
          />
        ) : (
          <EmptyState
            icon={<CalendarDays size={26} color={colors.brand} />}
            message="You haven’t requested any bookings yet."
            actionLabel="Find a professional"
            onAction={() => router.push('/(tabs)/search')}
          />
        )
      ) : (
        <View className="gap-8">
          <Group title="Needs action" bookings={groups.needsAction} perspective={perspective} hint={needsActionHint} />
          <Group title="Upcoming" bookings={groups.upcoming} perspective={perspective} />
          <Group title="Past" bookings={groups.past} perspective={perspective} />
        </View>
      )}
    </Screen>
  );
}

function Group({ title, bookings, perspective, hint }: { title: string; bookings: Booking[]; perspective: BookingPerspective; hint?: string }) {
  if (bookings.length === 0) return null;
  return (
    <View>
      <Text accessibilityRole="header" className="mb-3 font-heading text-lg text-ink">
        {title} <Text className="font-medium text-base text-muted">{bookings.length}</Text>
      </Text>
      <View className="gap-3">
        {bookings.map((booking) => (
          <BookingCard key={booking.id} booking={booking} perspective={perspective} hint={hint} />
        ))}
      </View>
    </View>
  );
}

/** One half of the Requests / Sent switch. */
function Segment({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      className={`h-11 flex-1 items-center justify-center rounded-xl ${active ? 'bg-primary' : ''}`}
    >
      <Text className={`font-semibold text-sm ${active ? 'text-on-primary' : 'text-muted'}`}>{label}</Text>
    </Pressable>
  );
}
