import { router, useLocalSearchParams } from 'expo-router';
import { CalendarDays, MapPin, Star, Wrench } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useAuthStore } from '@/features/authentication/store/auth-store';
import { StatusBadge } from '@/features/bookings/components/booking-card';
import { useBooking, useUpdateBookingStatus } from '@/features/bookings/hooks/use-bookings';
import {
  formatBookingDate,
  type Booking,
  type BookingPerspective,
  type BookingStatus,
} from '@/features/bookings/services/booking-service';
import { useReviewedBookingIds } from '@/features/reviews/hooks/use-reviews';
import { AppButton } from '@/shared/components/app-button';
import { Protected } from '@/shared/components/protected';
import { Screen } from '@/shared/components/screen';
import { ScreenHeader } from '@/shared/components/screen-header';
import { Skeleton } from '@/shared/components/skeleton';
import { EmptyState, ErrorState, ErrorText, isOfflineError } from '@/shared/components/states';
import { useThemeColors } from '@/shared/theme';

type Action = { label: string; status: BookingStatus; confirm: string; destructive?: boolean };

/** What the viewer may do next, mirroring the Firestore security rules. */
function actionsFor(booking: Booking, perspective: BookingPerspective): Action[] {
  if (perspective === 'builder') {
    if (booking.status === 'pending') {
      return [
        { label: 'Accept', status: 'accepted', confirm: `Accept this request from ${booking.customerName}?` },
        { label: 'Decline', status: 'declined', confirm: `Decline this request from ${booking.customerName}?`, destructive: true },
      ];
    }
    if (booking.status === 'accepted') {
      return [{ label: 'Mark as completed', status: 'completed', confirm: 'Mark this job as completed?' }];
    }
    return [];
  }
  if (booking.status === 'pending' || booking.status === 'accepted') {
    return [{ label: 'Cancel booking', status: 'cancelled', confirm: `Cancel your booking with ${booking.builderName}?`, destructive: true }];
  }
  return [];
}

export default function BookingDetail() {
  const colors = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useAuthStore((state) => state.session);
  const { data: booking, isLoading, isError, error, refetch, isRefetching } = useBooking(id);
  const reviewed = useReviewedBookingIds(session?.userId);
  const updateStatus = useUpdateBookingStatus();
  const [actionError, setActionError] = useState<string | null>(null);

  const perspective: BookingPerspective = booking?.builderId === session?.userId ? 'builder' : 'customer';
  const actions = booking ? actionsFor(booking, perspective) : [];
  const canReview =
    booking && perspective === 'customer' && booking.status === 'completed' && reviewed.data && !reviewed.data.includes(booking.id);
  const hasReviewed = booking && perspective === 'customer' && reviewed.data?.includes(booking.id);

  const runAction = (action: Action) => {
    if (!booking) return;
    // Changing a booking's status can't be undone, so always confirm first.
    Alert.alert(action.label, action.confirm, [
      { text: 'Back', style: 'cancel' },
      {
        text: action.label,
        style: action.destructive ? 'destructive' : 'default',
        onPress: async () => {
          setActionError(null);
          try {
            await updateStatus.mutateAsync({ bookingId: booking.id, status: action.status });
          } catch (failure) {
            console.warn('Booking update failed:', failure);
            setActionError(
              isOfflineError(failure)
                ? 'You’re offline. Reconnect and try again.'
                : 'We couldn’t update this booking. Please try again.',
            );
          }
        },
      },
    ]);
  };

  const footer =
    actions.length > 0 || canReview ? (
      <View>
        <View className="flex-row gap-3">
          {actions.map((action) => (
            <View key={action.status} className="flex-1">
              <AppButton
                label={action.label}
                variant={action.destructive ? 'outline' : 'primary'}
                loading={updateStatus.isPending && updateStatus.variables?.status === action.status}
                disabled={updateStatus.isPending}
                onPress={() => runAction(action)}
              />
            </View>
          ))}
          {canReview ? (
            <View className="flex-1">
              <AppButton
                label="Leave a review"
                onPress={() => router.push({ pathname: '/review', params: { bookingId: booking.id } })}
              />
            </View>
          ) : null}
        </View>
        <ErrorText>{actionError}</ErrorText>
      </View>
    ) : undefined;

  return (
    <Protected>
      <Screen header={<ScreenHeader title="Booking" />} footer={footer} refreshing={isRefetching} onRefresh={refetch}>
        {isLoading ? (
          <View accessibilityLabel="Loading" className="gap-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="mt-4 h-24 w-full" />
          </View>
        ) : isError ? (
          <ErrorState error={error} what="this booking" onRetry={() => refetch()} />
        ) : !booking ? (
          <EmptyState message="This booking no longer exists." actionLabel="My bookings" onAction={() => router.replace('/(tabs)/bookings' as never)} />
        ) : (
          <>
            <Text className="font-body text-sm text-muted">{perspective === 'builder' ? 'Request from' : 'Booking with'}</Text>
            <View className="mt-1 flex-row items-center justify-between gap-3">
              <Text className="flex-1 font-heading text-3xl text-ink">
                {perspective === 'builder' ? booking.customerName : booking.builderName}
              </Text>
              <StatusBadge status={booking.status} />
            </View>

            <View className="mt-6 gap-4 rounded-2xl border border-line p-4">
              <Detail icon={<Wrench size={18} color={colors.muted} />} label="Service" value={booking.service} />
              <Detail icon={<CalendarDays size={18} color={colors.muted} />} label="Preferred date" value={formatBookingDate(booking.preferredDate)} />
              <Detail icon={<MapPin size={18} color={colors.muted} />} label="Location" value={booking.location} />
            </View>

            <Text className="mb-2 mt-8 font-heading-semibold text-lg text-ink">Work description</Text>
            <Text className="font-body text-base text-muted">{booking.description}</Text>

            {hasReviewed ? (
              <View className="mt-8 flex-row items-center gap-2">
                <Star size={16} color={colors.star} fill={colors.star} />
                <Text className="font-medium text-sm text-muted">You reviewed this job</Text>
              </View>
            ) : null}
          </>
        )}
      </Screen>
    </Protected>
  );
}

function Detail({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <View className="flex-row gap-3">
      <View className="mt-0.5">{icon}</View>
      <View className="flex-1">
        <Text className="font-medium text-xs text-faint">{label}</Text>
        <Text className="mt-0.5 font-body text-base text-ink">{value}</Text>
      </View>
    </View>
  );
}
