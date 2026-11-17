import { router } from 'expo-router';
import { Search } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useAuthStore } from '@/features/authentication/store/auth-store';
import { BookingCard } from '@/features/bookings/components/booking-card';
import { useBookings } from '@/features/bookings/hooks/use-bookings';
import { groupBookings } from '@/features/bookings/services/booking-service';
import { BuilderCard } from '@/features/builders/components/builder-card';
import { useBuilders, useOwnBuilder } from '@/features/builders/hooks/use-builders';
import { TRADES } from '@/features/builders/services/builder-service';
import { Chip } from '@/shared/components/chip';
import { Screen } from '@/shared/components/screen';
import { ListSkeleton } from '@/shared/components/skeleton';
import { EmptyState, ErrorState } from '@/shared/components/states';
import { useThemeColors } from '@/shared/theme';

export default function Home() {
  const role = useAuthStore((state) => state.session?.role);
  return role === 'builder' ? <BuilderHome /> : <CustomerHome />;
}

/** Customers: search, browse by trade, and the top-rated professionals. */
function CustomerHome() {
  const colors = useThemeColors();
  const session = useAuthStore((state) => state.session);
  const builders = useBuilders();
  const bookings = useBookings(session?.userId, 'customer');

  // The catalogue is sorted by rating, so the first few are the top rated.
  const featured = (builders.data ?? []).slice(0, 3);
  // The customer's next open booking, if they have one.
  const activeBooking = groupBookings(bookings.data ?? [], 'customer', undefined).upcoming[0];

  return (
    <Screen
      refreshing={builders.isRefetching || bookings.isRefetching}
      onRefresh={() => {
        builders.refetch();
        bookings.refetch();
      }}
    >
      <Text className="font-heading text-3xl text-ink">Find a builder</Text>

      <Pressable
        accessibilityRole="search"
        onPress={() => router.push('/(tabs)/search')}
        className="mt-5 h-14 flex-row items-center gap-3 rounded-xl border border-line bg-surface px-4 active:bg-subtle"
      >
        <Search size={20} color={colors.muted} />
        <Text className="font-body text-base text-faint">Search a trade or name</Text>
      </Pressable>

      {activeBooking ? (
        <View className="mt-8">
          <Text className="mb-3 font-heading-semibold text-lg text-ink">Your booking</Text>
          <BookingCard booking={activeBooking} perspective="customer" />
        </View>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="-mx-5 mt-8 flex-grow-0"
        contentContainerClassName="gap-2 px-5"
      >
        {TRADES.map((trade) => (
          <Chip key={trade} label={trade} onPress={() => router.push({ pathname: '/(tabs)/search', params: { q: trade } })} />
        ))}
      </ScrollView>

      <View className="mb-3 mt-8 flex-row items-center justify-between">
        <Text className="font-heading-semibold text-lg text-ink">Top rated near you</Text>
        <Pressable hitSlop={12} onPress={() => router.push('/(tabs)/search')}>
          <Text className="font-semibold text-sm text-brand">See all</Text>
        </Pressable>
      </View>

      {builders.isLoading ? (
        <ListSkeleton />
      ) : builders.isError ? (
        <ErrorState error={builders.error} what="professionals" onRetry={() => builders.refetch()} />
      ) : featured.length === 0 ? (
        <EmptyState message="No verified professionals yet. Check back soon." />
      ) : (
        <View className="gap-3">
          {featured.map((builder) => (
            <BuilderCard key={builder.id} builder={builder} />
          ))}
        </View>
      )}
    </Screen>
  );
}

/** Builders: requests waiting for an answer first, then the jobs ahead. */
function BuilderHome() {
  const session = useAuthStore((state) => state.session);
  const bookings = useBookings(session?.userId, 'builder');
  const listing = useOwnBuilder(session?.userId);
  const { needsAction, upcoming } = groupBookings(bookings.data ?? [], 'builder', undefined);

  // Customers can only find and book verified listings.
  const listingNotice =
    listing.isLoading || listing.isError
      ? null
      : !listing.data
        ? { title: 'Set up your profile', text: 'Add your details and skills so customers can find and book you.' }
        : listing.data.verificationStatus === 'pending'
          ? { title: 'Profile under review', text: 'Customers will see you once your profile has been verified.' }
          : listing.data.verificationStatus === 'rejected'
            ? { title: 'Profile not approved', text: 'Update your details and save to submit your profile again.' }
            : null;

  return (
    <Screen
      refreshing={bookings.isRefetching || listing.isRefetching}
      onRefresh={() => {
        bookings.refetch();
        listing.refetch();
      }}
    >
      <Text className="font-heading text-3xl text-ink">Your work</Text>

      {listingNotice ? (
        <Pressable onPress={() => router.push('/builder-profile')} className="mt-5 rounded-2xl bg-subtle p-4 active:opacity-80">
          <Text className="font-semibold text-base text-ink">{listingNotice.title}</Text>
          <Text className="mt-1 font-body text-sm text-muted">{listingNotice.text}</Text>
          <Text className="mt-3 font-semibold text-sm text-brand">Open builder workspace</Text>
        </Pressable>
      ) : null}

      <Text className="mb-3 mt-8 font-heading-semibold text-lg text-ink">
        New requests{needsAction.length ? ` (${needsAction.length})` : ''}
      </Text>
      {bookings.isLoading ? (
        <ListSkeleton count={2} />
      ) : bookings.isError ? (
        <ErrorState error={bookings.error} what="your requests" onRetry={() => bookings.refetch()} />
      ) : needsAction.length === 0 ? (
        <EmptyState message="No requests waiting. New booking requests from customers appear here." />
      ) : (
        <View className="gap-3">
          {needsAction.map((booking) => (
            <BookingCard key={booking.id} booking={booking} perspective="builder" hint="Respond to this request" />
          ))}
        </View>
      )}

      {bookings.isLoading || bookings.isError ? null : (
        <>
          <Text className="mb-3 mt-8 font-heading-semibold text-lg text-ink">Upcoming jobs</Text>
          {upcoming.length === 0 ? (
            <EmptyState message="No upcoming jobs. Requests you accept appear here." />
          ) : (
            <View className="gap-3">
              {upcoming.map((booking) => (
                <BookingCard key={booking.id} booking={booking} perspective="builder" />
              ))}
            </View>
          )}
        </>
      )}
    </Screen>
  );
}
