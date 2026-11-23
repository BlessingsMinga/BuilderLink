import { router, type Href } from 'expo-router';
import {
  BrickWall,
  CalendarCheck,
  ChevronDown,
  Ellipsis,
  Flame,
  Grid3x3,
  Hammer,
  HardHat,
  House,
  Inbox,
  Layers,
  MapPin,
  PaintRoller,
  Search,
  SlidersHorizontal,
  Star,
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
import { TRADES, type OwnBuilder } from '@/features/builders/services/builder-service';
import { useBuilderReviews } from '@/features/reviews/hooks/use-reviews';
import { averageRating } from '@/features/reviews/services/review-service';
import { Avatar } from '@/shared/components/chip';
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
      <Text accessibilityRole="header" className="font-heading text-lg text-ink">
        {title}
      </Text>
      {action && onAction ? (
        <Pressable hitSlop={12} onPress={onAction}>
          <Text className="font-semibold text-sm text-brand">{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** "Good morning" / "Good afternoon" / "Good evening" from the phone's clock. */
function timeGreeting(): string {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}

/** The trades shown as tiles on Home; the last tile opens the full list in search. */
const HOME_TRADES = TRADES.slice(0, 7);

/** Customers: search, their current booking, browse by trade, and top-rated professionals. */
function CustomerHome() {
  const colors = useThemeColors();
  const session = useAuthStore((state) => state.session);
  const { data: profile } = useProfile(session?.userId);
  const builders = useBuilders();
  const bookings = useBookings(session?.userId, 'customer');

  const firstName = profile && profile.fullName !== 'BuilderLink member' ? profile.fullName.split(/\s+/)[0] : null;
  // The catalogue is sorted by rating, so the first few are the top rated.
  const featured = (builders.data ?? []).slice(0, 4);
  // The customer's next open booking, if they have one.
  const activeBooking = groupBookings(bookings.data ?? [], 'customer', undefined).upcoming[0];
  const openSearch = (q?: string) => router.push(q ? { pathname: '/(tabs)/search', params: { q } } : '/(tabs)/search');

  return (
    <Screen
      refreshing={builders.isRefetching || bookings.isRefetching}
      onRefresh={() => {
        builders.refetch();
        bookings.refetch();
      }}
    >
      <View className="flex-row items-center gap-3">
        <Avatar name={profile?.fullName ?? '?'} size="sm" photoUrl={profile?.avatarUrl} />
        <View className="flex-1">
          <Text className="font-body text-xs text-muted">{timeGreeting()}</Text>
          {firstName ? <Text className="font-semibold text-base text-ink">{firstName}</Text> : null}
        </View>
      </View>

      <Text accessibilityRole="header" className="mt-5 font-heading text-[34px] leading-[36px] tracking-tight text-ink">
        Find a builder{'\n'}
        <Text className="text-brand">you can trust.</Text>
      </Text>

      <View className="mt-5 flex-row gap-2.5">
        <Pressable
          accessibilityRole="search"
          accessibilityLabel="Search trades or builders"
          onPress={() => openSearch()}
          className="h-[52px] flex-1 flex-row items-center gap-2.5 rounded-2xl border border-line bg-subtle px-4 active:opacity-80"
        >
          <Search size={20} color={colors.muted} />
          <Text numberOfLines={1} className="flex-1 font-body text-sm text-muted">Plumber, electrician, name…</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Filters"
          onPress={() => openSearch()}
          className="h-[52px] w-[52px] items-center justify-center rounded-2xl bg-primary active:opacity-80"
        >
          <SlidersHorizontal size={20} color={colors.onPrimary} />
        </Pressable>
      </View>

      {profile?.district ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Builders near ${profile.district}`}
          onPress={() => openSearch(profile.district ?? undefined)}
          className="mt-5 h-9 flex-row items-center gap-1.5 self-start rounded-full border border-line pl-2.5 pr-3.5 active:bg-subtle"
        >
          <MapPin size={16} color={colors.brand} />
          <Text className="font-medium text-xs text-ink">Near {profile.district}</Text>
          <ChevronDown size={14} color={colors.muted} />
        </Pressable>
      ) : null}

      {activeBooking ? (
        <>
          <SectionTitle title="Your booking" action="Details" onAction={() => router.push(`/bookings/${activeBooking.id}` as Href)} />
          <BookingCard booking={activeBooking} perspective="customer" />
        </>
      ) : null}

      <SectionTitle title="Browse by trade" action="All trades" onAction={() => openSearch()} />
      <View className="flex-row flex-wrap" style={{ gap: 10 }}>
        {[...HOME_TRADES, 'More' as const].map((trade) => {
          const Icon = trade === 'More' ? Ellipsis : tradeIcons[trade];
          return (
            <Pressable
              key={trade}
              accessibilityRole="button"
              accessibilityLabel={trade === 'More' ? 'All trades' : trade}
              onPress={() => openSearch(trade === 'More' ? undefined : trade)}
              style={{ width: '22.5%', flexGrow: 1 }}
              className="items-center gap-2 rounded-[18px] border border-line bg-subtle px-1 pb-3 pt-3.5 active:opacity-70"
            >
              <Icon size={26} color={colors.brand} strokeWidth={1.7} />
              <Text numberOfLines={1} adjustsFontSizeToFit className="text-center font-medium text-xs text-ink">
                {trade}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <SectionTitle title="Top rated" action="See all" onAction={() => openSearch()} />
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
          <Text accessibilityRole="header" className="mt-1 font-heading text-3xl text-white">
            Your work
          </Text>
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

      <Text accessibilityRole="header" className="mb-3 font-heading text-lg text-ink">New requests</Text>
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

  const toggle = (available: boolean) =>
    setAvailability.mutate(available, {
      onSuccess: () =>
        toast.success(available ? 'You’re taking new jobs. Customers can book you again.' : 'New requests paused. Existing jobs aren’t affected.'),
      onError: (error) => toast.error(failureMessage(error, 'change your availability')),
    });

  return (
    <View className="mb-8">
      <View className="rounded-3xl border border-line bg-surface p-5" style={CARD_SHADOW}>
        <View className="flex-row items-center gap-4">
          <View className="flex-1">
            <View className={`flex-row items-center gap-1.5 self-start rounded-full px-2.5 py-1 ${listing.available ? 'bg-brand-soft' : 'bg-subtle'}`}>
              <View className={`h-2 w-2 rounded-full ${listing.available ? 'bg-primary' : 'bg-faint'}`} />
              <Text className={`font-bold text-xs ${listing.available ? 'text-brand' : 'text-muted'}`}>
                {listing.available ? 'Available for new jobs' : 'New requests paused'}
              </Text>
            </View>
            <Text className="mt-2 font-body text-sm text-muted">
              {listing.available ? 'Customers can send you booking requests.' : 'Customers can see you but can’t book.'}
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

        <View className="mt-4 flex-row gap-2">
          <MiniStat icon={<Star size={15} color={colors.star} fill={colors.star} />} value={reviewCount ? rating.toFixed(1) : '–'} label={reviewCount === 1 ? '1 review' : `${reviewCount} reviews`} />
          <MiniStat value={String(listing.completedJobs)} label="Jobs done" />
          <MiniStat value={shortReply(listing.responseTimeMinutes) ?? '–'} label="Replies in" />
        </View>
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
                <Text numberOfLines={3} className="mt-2 font-body text-sm text-ink">
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

/** "~45 min", "~2 h", "~1 day", matching the profile's stat tile. */
function shortReply(minutes: number | null): string | null {
  if (minutes == null) return null;
  if (minutes < 60) return `~${Math.max(5, Math.round(minutes / 5) * 5)} min`;
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `~${hours} h` : `~${Math.round(hours / 24)} d`;
}

const CARD_SHADOW = { elevation: 3, shadowColor: '#10201E', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } };

function MiniStat({ icon, value, label }: { icon?: React.ReactNode; value: string; label: string }) {
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} className="flex-1 items-center rounded-2xl bg-canvas px-1 py-3">
      <View className="flex-row items-center gap-1">
        {icon}
        <Text numberOfLines={1} adjustsFontSizeToFit className="font-heading text-xl text-ink">
          {value}
        </Text>
      </View>
      <Text numberOfLines={1} className="mt-0.5 font-body text-xs text-muted">
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
