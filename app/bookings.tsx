import { router } from 'expo-router';
import { CalendarDays, ChevronLeft, MapPin, Star } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { useAuthStore } from '@/features/authentication/store/auth-store';
import { useBookings, useUpdateBookingStatus } from '@/features/bookings/hooks/use-bookings';
import {
  formatBookingDate,
  type Booking,
  type BookingPerspective,
  type BookingStatus,
} from '@/features/bookings/services/booking-service';
import { useReviewedBookingIds } from '@/features/reviews/hooks/use-reviews';
import { Protected } from '@/shared/components/protected';
import { Screen } from '@/shared/components/screen';
import { useThemeColors } from '@/shared/theme';

const statusStyles: Record<BookingStatus, { label: string; badge: string; text: string }> = {
  pending: { label: 'Pending', badge: 'bg-brand-soft', text: 'text-brand' },
  accepted: { label: 'Accepted', badge: 'bg-success-soft', text: 'text-success' },
  completed: { label: 'Completed', badge: 'bg-info-soft', text: 'text-info' },
  declined: { label: 'Declined', badge: 'bg-danger-soft', text: 'text-danger' },
  cancelled: { label: 'Cancelled', badge: 'bg-subtle', text: 'text-muted' },
};

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
      return [{ label: 'Mark completed', status: 'completed', confirm: 'Mark this job as completed?' }];
    }
    return [];
  }
  if (booking.status === 'pending' || booking.status === 'accepted') {
    return [{ label: 'Cancel booking', status: 'cancelled', confirm: `Cancel your booking with ${booking.builderName}?`, destructive: true }];
  }
  return [];
}

export default function Bookings() {
  const colors = useThemeColors();
  const session = useAuthStore((state) => state.session);
  const isBuilder = session?.role === 'builder';
  const [perspective, setPerspective] = useState<BookingPerspective>(isBuilder ? 'builder' : 'customer');
  const { data: bookings = [], isLoading, isError, refetch, isRefetching } = useBookings(session?.userId, perspective);
  const updateStatus = useUpdateBookingStatus();
  // Undefined until loaded, so the review prompt never flashes on an already-reviewed booking.
  const { data: reviewedIds } = useReviewedBookingIds(session?.userId);

  const runAction = (booking: Booking, action: Action) => {
    Alert.alert(action.label, action.confirm, [
      { text: 'Back', style: 'cancel' },
      {
        text: action.label,
        style: action.destructive ? 'destructive' : 'default',
        onPress: async () => {
          try {
            await updateStatus.mutateAsync({ bookingId: booking.id, status: action.status });
          } catch (error) {
            console.warn('Booking update failed:', error);
            Alert.alert('Could not update booking', 'Please check your connection and try again.');
          }
        },
      },
    ]);
  };

  return (
    <Protected>
      <Screen>
        <Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface">
          <ChevronLeft color={colors.ink} />
        </Pressable>
        <Text className="mt-6 text-3xl font-bold text-ink">My bookings</Text>

        {isBuilder ? (
          <View className="mt-5 flex-row gap-2 rounded-xl border border-line bg-surface p-1">
            <Tab label="Incoming requests" active={perspective === 'builder'} onPress={() => setPerspective('builder')} />
            <Tab label="Sent by me" active={perspective === 'customer'} onPress={() => setPerspective('customer')} />
          </View>
        ) : null}

        {isLoading ? (
          <View className="mt-16 items-center gap-3">
            <ActivityIndicator size="large" color={colors.ink} />
            <Text className="text-muted">Loading bookings…</Text>
          </View>
        ) : isError ? (
          <View className="mt-10 items-center gap-4 rounded-2xl border border-line bg-surface p-6">
            <Text className="text-base text-muted">We couldn’t load your bookings.</Text>
            <Pressable onPress={() => refetch()} className="rounded-xl bg-ink px-6 py-3">
              <Text className="font-bold text-canvas">Try again</Text>
            </Pressable>
          </View>
        ) : bookings.length === 0 ? (
          <View className="mt-10 items-center gap-4 rounded-2xl border border-line bg-surface p-6">
            <Text className="text-center text-base text-muted">
              {perspective === 'builder'
                ? 'No booking requests yet. New requests from customers will appear here.'
                : 'You haven’t requested any bookings yet.'}
            </Text>
            {perspective === 'customer' ? (
              <Pressable onPress={() => router.push('/(tabs)/search')} className="rounded-xl bg-ink px-6 py-3">
                <Text className="font-bold text-canvas">Find a professional</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View className="mt-5 gap-4 pb-6">
            {bookings.map((booking) => {
              const style = statusStyles[booking.status];
              const actions = actionsFor(booking, perspective);
              const isCompletedForCustomer = perspective === 'customer' && booking.status === 'completed';
              const reviewed = reviewedIds?.includes(booking.id);
              return (
                <View key={booking.id} className="rounded-2xl border border-line bg-surface p-5">
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-ink">
                        {perspective === 'builder' ? booking.customerName : booking.builderName}
                      </Text>
                      <Text className="text-muted">{booking.service}</Text>
                    </View>
                    <View className={`rounded-full px-3 py-1 ${style.badge}`}>
                      <Text className={`text-xs font-bold ${style.text}`}>{style.label}</Text>
                    </View>
                  </View>

                  <View className="mt-4 flex-row items-center gap-2">
                    <CalendarDays size={16} color={colors.muted} />
                    <Text className="text-muted">{formatBookingDate(booking.preferredDate)}</Text>
                  </View>
                  <View className="mt-2 flex-row items-center gap-2">
                    <MapPin size={16} color={colors.muted} />
                    <Text className="flex-1 text-muted">{booking.location}</Text>
                  </View>
                  <Text className="mt-3 leading-5 text-muted">{booking.description}</Text>

                  {actions.length > 0 ? (
                    <View className="mt-4 flex-row gap-3">
                      {actions.map((action) => (
                        <Pressable
                          key={action.status}
                          disabled={updateStatus.isPending}
                          onPress={() => runAction(booking, action)}
                          className={`h-12 flex-1 items-center justify-center rounded-xl ${action.destructive ? 'border border-line bg-surface' : 'bg-ink'} ${updateStatus.isPending ? 'opacity-60' : ''}`}
                        >
                          <Text className={`font-bold ${action.destructive ? 'text-danger' : 'text-canvas'}`}>{action.label}</Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}

                  {isCompletedForCustomer && reviewed === false ? (
                    <Pressable
                      onPress={() => router.push({ pathname: '/review', params: { bookingId: booking.id } })}
                      className="mt-4 h-12 flex-row items-center justify-center gap-2 rounded-xl bg-ink"
                    >
                      <Star size={18} color={colors.canvas} />
                      <Text className="font-bold text-canvas">Leave a review</Text>
                    </Pressable>
                  ) : isCompletedForCustomer && reviewed ? (
                    <View className="mt-4 flex-row items-center gap-2">
                      <Star size={16} color={colors.brand} fill={colors.brand} />
                      <Text className="font-semibold text-muted">You reviewed this job</Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
            <Pressable onPress={() => refetch()} disabled={isRefetching} className="items-center py-2">
              <Text className="font-semibold text-brand">{isRefetching ? 'Refreshing…' : 'Refresh'}</Text>
            </Pressable>
          </View>
        )}
      </Screen>
    </Protected>
  );
}

function Tab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={`h-11 flex-1 items-center justify-center rounded-xl ${active ? 'bg-ink' : ''}`}>
      <Text className={`font-bold ${active ? 'text-canvas' : 'text-muted'}`}>{label}</Text>
    </Pressable>
  );
}
