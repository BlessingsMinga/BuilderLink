import { router } from 'expo-router';
import {
  BrickWall,
  CalendarCheck,
  Flame,
  Grid3x3,
  Hammer,
  HardHat,
  House,
  Inbox,
  Layers,
  PaintRoller,
  Search,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useProfile } from '@/features/authentication/hooks/use-profile';
import { useAuthStore } from '@/features/authentication/store/auth-store';
import { BookingCard } from '@/features/bookings/components/booking-card';
import { useBookings } from '@/features/bookings/hooks/use-bookings';
import { groupBookings } from '@/features/bookings/services/booking-service';
import { BuilderCard } from '@/features/builders/components/builder-card';
import { useBuilders, useOwnBuilder } from '@/features/builders/hooks/use-builders';
import { TRADES } from '@/features/builders/services/builder-service';
import { Screen } from '@/shared/components/screen';
import { ListSkeleton } from '@/shared/components/skeleton';
import { EmptyState, ErrorState } from '@/shared/components/states';
import { useThemeColors } from '@/shared/theme';

const tradeIcons: Record<(typeof TRADES)[number], LucideIcon> = {
  Bricklayer: BrickWall,
  Plumber: Wrench,
  Carpenter: Hammer,
  Electrician: Zap,
  Painter: PaintRoller,
  Roofer: House,
  Tiler: Grid3x3,
  Welder: Flame,
  Plasterer: Layers,
  'General builder': HardHat,
};

export default function Home() {
  const role = useAuthStore((state) => state.session?.role);
  return role === 'builder' ? <BuilderHome /> : <CustomerHome />;
}

/** "Hello, Thoko" once the profile has loaded; a plain "Hello" otherwise. */
function useGreeting() {
  const session = useAuthStore((state) => state.session);
  const { data: profile } = useProfile(session?.userId);
  const firstName = profile?.fullName.split(/\s+/)[0];
  // Phone-only accounts get a placeholder name; don't greet anyone as "BuilderLink".
  return firstName && profile?.fullName !== 'BuilderLink member' ? `Hello, ${firstName}` : 'Hello';
}

function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View className="mb-3 mt-8 flex-row items-center justify-between">
      <Text className="font-heading-semibold text-lg text-ink">{title}</Text>
      {action && onAction ? (
        <Pressable hitSlop={12} onPress={onAction}>
          <Text className="font-semibold text-sm text-brand">{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Customers: search, browse by trade, and the top-rated professionals. */
function CustomerHome() {
  const colors = useThemeColors();
  const greeting = useGreeting();
  const session = useAuthStore((state) => state.session);
  const builders = useBuilders();
  const bookings = useBookings(session?.userId, 'customer');

  // The catalogue is sorted by rating, so the first few are the top rated.
  const featured = (builders.data ?? []).slice(0, 4);
  // The customer's next open booking, if they have one.
  const activeBooking = groupBookings(bookings.data ?? [], 'customer', undefined).upcoming[0];

  return (
    <Screen
      refreshing={builders.isRefetching || bookings.isRefetching}
      onRefresh={() => {
        builders.refetch();
        bookings.refetch();
      }}
      hero={
        <>
          <Text className="font-medium text-sm text-white/80">{greeting}</Text>
          <Text className="mt-1 font-heading text-3xl text-white">Find a trusted builder</Text>
          <Pressable
            accessibilityRole="search"
            onPress={() => router.push('/(tabs)/search')}
            className="mt-5 h-14 flex-row items-center gap-3 rounded-2xl bg-surface px-4 active:opacity-90"
          >
            <Search size={20} color={colors.muted} />
            <Text className="font-body text-base text-faint">Search a trade or name</Text>
          </Pressable>
        </>
      }
    >
      {activeBooking ? (
        <View className="mb-8">
          <Text className="mb-3 font-heading-semibold text-lg text-ink">Your booking</Text>
          <BookingCard booking={activeBooking} perspective="customer" />
        </View>
      ) : null}

      <Text className="mb-3 font-heading-semibold text-lg text-ink">Browse by trade</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 flex-grow-0" contentContainerClassName="gap-3 px-5">
        {TRADES.map((trade) => {
          const Icon = tradeIcons[trade];
          return (
            <Pressable
              key={trade}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/(tabs)/search', params: { q: trade } })}
              className="w-20 items-center gap-2 active:opacity-70"
            >
              <View className="h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft">
                <Icon size={26} color={colors.brand} />
              </View>
              <Text numberOfLines={2} className="text-center font-medium text-xs text-ink">
                {trade}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <SectionTitle title="Top rated" action="See all" onAction={() => router.push('/(tabs)/search')} />
      {builders.isLoading ? (
        <ListSkeleton />
      ) : builders.isError ? (
        <ErrorState error={builders.error} what="professionals" onRetry={() => builders.refetch()} />
      ) : featured.length === 0 ? (
        <EmptyState icon={<HardHat size={26} color={colors.brand} />} message="No verified professionals yet. Check back soon." />
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
  const colors = useThemeColors();
  const greeting = useGreeting();
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
  const counted = !bookings.isLoading && !bookings.isError;

  return (
    <Screen
      refreshing={bookings.isRefetching || listing.isRefetching}
      onRefresh={() => {
        bookings.refetch();
        listing.refetch();
      }}
      hero={
        <>
          <Text className="font-medium text-sm text-white/80">{greeting}</Text>
          <Text className="mt-1 font-heading text-3xl text-white">Your work</Text>
          <View className="mt-5 flex-row gap-3">
            <HeroStat value={counted ? String(needsAction.length) : '–'} label="New requests" />
            <HeroStat value={counted ? String(upcoming.length) : '–'} label="Upcoming jobs" />
          </View>
        </>
      }
    >
      {listingNotice ? (
        <Pressable onPress={() => router.push('/builder-profile')} className="mb-8 rounded-3xl bg-warn-soft p-4 active:opacity-80">
          <Text className="font-bold text-base text-ink">{listingNotice.title}</Text>
          <Text className="mt-1 font-body text-sm text-muted">{listingNotice.text}</Text>
          <Text className="mt-3 font-semibold text-sm text-brand">Open builder workspace</Text>
        </Pressable>
      ) : null}

      <Text className="mb-3 font-heading-semibold text-lg text-ink">New requests</Text>
      {bookings.isLoading ? (
        <ListSkeleton count={2} />
      ) : bookings.isError ? (
        <ErrorState error={bookings.error} what="your requests" onRetry={() => bookings.refetch()} />
      ) : needsAction.length === 0 ? (
        <EmptyState
          icon={<Inbox size={26} color={colors.brand} />}
          message="No requests waiting. New booking requests from customers appear here."
        />
      ) : (
        <View className="gap-3">
          {needsAction.map((booking) => (
            <BookingCard key={booking.id} booking={booking} perspective="builder" hint="Respond to this request" />
          ))}
        </View>
      )}

      {counted ? (
        <>
          <SectionTitle title="Upcoming jobs" />
          {upcoming.length === 0 ? (
            <EmptyState
              icon={<CalendarCheck size={26} color={colors.brand} />}
              message="No upcoming jobs. Requests you accept appear here."
            />
          ) : (
            <View className="gap-3">
              {upcoming.map((booking) => (
                <BookingCard key={booking.id} booking={booking} perspective="builder" />
              ))}
            </View>
          )}
        </>
      ) : null}
    </Screen>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <View className="flex-1 rounded-2xl bg-white/15 p-4">
      <Text className="font-heading text-3xl text-white">{value}</Text>
      <Text className="font-medium text-sm text-white/80">{label}</Text>
    </View>
  );
}
