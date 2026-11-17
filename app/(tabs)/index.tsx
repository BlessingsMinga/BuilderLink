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
  Star,
  Timer,
  Trophy,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useProfile } from '@/features/authentication/hooks/use-profile';
import { useAuthStore } from '@/features/authentication/store/auth-store';
import { BookingCard } from '@/features/bookings/components/booking-card';
import { useBookings } from '@/features/bookings/hooks/use-bookings';
import { groupBookings } from '@/features/bookings/services/booking-service';
import { BuilderCard } from '@/features/builders/components/builder-card';
import { useBuilders, useOwnBuilder, useSetAvailability } from '@/features/builders/hooks/use-builders';
import { TRADES, formatResponseTime, type OwnBuilder } from '@/features/builders/services/builder-service';
import { useBuilderReviews } from '@/features/reviews/hooks/use-reviews';
import { averageRating } from '@/features/reviews/services/review-service';
import { failureMessage, toast } from '@/shared/components/toast';
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
          {listing.data?.verificationStatus === 'rejected' && listing.data.rejectionReason ? (
            <Text className="mt-2 font-medium text-sm text-ink">Reviewer’s note: “{listing.data.rejectionReason}”</Text>
          ) : null}
          <Text className="mt-3 font-semibold text-sm text-brand">Open builder workspace</Text>
        </Pressable>
      ) : null}

      {listing.data && session ? <BuilderOverview builderId={session.userId} listing={listing.data} /> : null}

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

/** Availability switch, the builder's own numbers, and their latest reviews. */
function BuilderOverview({ builderId, listing }: { builderId: string; listing: OwnBuilder }) {
  const colors = useThemeColors();
  const setAvailability = useSetAvailability(builderId);
  const reviews = useBuilderReviews(builderId);
  const reviewCount = reviews.data?.length ?? 0;
  const rating = averageRating(reviews.data ?? []) ?? listing.rating;
  const responseTime = formatResponseTime(listing.responseTimeMinutes);

  const toggle = (available: boolean) =>
    setAvailability.mutate(available, {
      onSuccess: () =>
        toast.success(available ? 'You’re taking new jobs. Customers can book you again.' : 'New requests paused. Existing jobs aren’t affected.'),
      onError: (error) => toast.error(failureMessage(error, 'change your availability')),
    });

  return (
    <View className="mb-8">
      <View className="flex-row items-center gap-4 rounded-3xl border border-line bg-surface p-4">
        <View className="flex-1">
          <Text className="font-bold text-base text-ink">Taking new jobs</Text>
          <Text className="mt-0.5 font-body text-sm text-muted">
            {listing.available ? 'Customers can send you booking requests.' : 'Paused. Customers can see you but can’t book.'}
          </Text>
        </View>
        <Switch
          accessibilityLabel="Taking new jobs"
          value={listing.available}
          disabled={setAvailability.isPending}
          onValueChange={toggle}
          trackColor={{ true: colors.primary, false: colors.line }}
          thumbColor={colors.surface}
        />
      </View>

      <View className="mt-3 flex-row gap-3">
        <MiniStat icon={<Star size={18} color={colors.star} fill={colors.star} />} value={reviewCount ? rating.toFixed(1) : '–'} label={reviewCount === 1 ? '1 review' : `${reviewCount} reviews`} />
        <MiniStat icon={<Trophy size={18} color={colors.brand} />} value={String(listing.completedJobs)} label="Jobs done" />
        <MiniStat icon={<Timer size={18} color={colors.brand} />} value={responseTime ? responseTime.replace('Usually replies within ', '< ') : '–'} label="Reply time" />
      </View>

      {reviews.data && reviews.data.length > 0 ? (
        <>
          <SectionTitle title="Latest reviews" />
          <View className="gap-3">
            {reviews.data.slice(0, 3).map((review) => (
              <View key={review.id} className="rounded-3xl border border-line bg-surface p-4">
                <View className="flex-row items-center justify-between gap-3">
                  <Text numberOfLines={1} className="flex-1 font-bold text-base text-ink">
                    {review.customerName}
                  </Text>
                  <View className="flex-row gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} size={14} color={colors.star} fill={star <= review.rating ? colors.star : 'transparent'} />
                    ))}
                  </View>
                </View>
                <Text numberOfLines={3} className="mt-2 font-body text-sm text-muted">
                  {review.comment}
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

function MiniStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <View className="flex-1 items-center rounded-3xl border border-line bg-surface px-2 py-3">
      {icon}
      <Text numberOfLines={1} className="mt-1 font-heading-semibold text-base text-ink">
        {value}
      </Text>
      <Text numberOfLines={1} className="font-body text-xs text-muted">
        {label}
      </Text>
    </View>
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
