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

const statusStyles: Record<BookingStatus, { label: string; badge: string; text: string }> = {
  pending: { label: 'Pending', badge: 'bg-orange-100', text: 'text-orange-700' },
  accepted: { label: 'Accepted', badge: 'bg-green-100', text: 'text-green-700' },
  completed: { label: 'Completed', badge: 'bg-blue-100', text: 'text-blue-700' },
  declined: { label: 'Declined', badge: 'bg-red-100', text: 'text-red-700' },
  cancelled: { label: 'Cancelled', badge: 'bg-slate-200', text: 'text-slate-600' },
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
        <Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-2xl bg-white">
          <ChevronLeft color="#1E293B" />
        </Pressable>
        <Text className="mt-6 text-3xl font-extrabold text-ink">My bookings</Text>

        {isBuilder ? (
          <View className="mt-5 flex-row gap-2 rounded-2xl bg-white p-1">
            <Tab label="Incoming requests" active={perspective === 'builder'} onPress={() => setPerspective('builder')} />
            <Tab label="Sent by me" active={perspective === 'customer'} onPress={() => setPerspective('customer')} />
          </View>
        ) : null}

        {isLoading ? (
          <View className="mt-16 items-center gap-3">
            <ActivityIndicator size="large" color="#F97316" />
            <Text className="text-slate-500">Loading bookings…</Text>
          </View>
        ) : isError ? (
          <View className="mt-10 items-center gap-4 rounded-3xl bg-white p-6">
            <Text className="text-base text-slate-500">We couldn’t load your bookings.</Text>
            <Pressable onPress={() => refetch()} className="rounded-2xl bg-brand px-6 py-3">
              <Text className="font-bold text-white">Try again</Text>
            </Pressable>
          </View>
        ) : bookings.length === 0 ? (
          <View className="mt-10 items-center gap-4 rounded-3xl bg-white p-6">
            <Text className="text-center text-base text-slate-500">
              {perspective === 'builder'
                ? 'No booking requests yet. New requests from customers will appear here.'
                : 'You haven’t requested any bookings yet.'}
            </Text>
            {perspective === 'customer' ? (
              <Pressable onPress={() => router.push('/(tabs)/search')} className="rounded-2xl bg-brand px-6 py-3">
                <Text className="font-bold text-white">Find a professional</Text>
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
                <View key={booking.id} className="rounded-3xl bg-white p-5">
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-ink">
                        {perspective === 'builder' ? booking.customerName : booking.builderName}
                      </Text>
                      <Text className="text-slate-500">{booking.service}</Text>
                    </View>
                    <View className={`rounded-full px-3 py-1 ${style.badge}`}>
                      <Text className={`text-xs font-bold ${style.text}`}>{style.label}</Text>
                    </View>
                  </View>

                  <View className="mt-4 flex-row items-center gap-2">
                    <CalendarDays size={16} color="#64748B" />
                    <Text className="text-slate-600">{formatBookingDate(booking.preferredDate)}</Text>
                  </View>
                  <View className="mt-2 flex-row items-center gap-2">
                    <MapPin size={16} color="#64748B" />
                    <Text className="flex-1 text-slate-600">{booking.location}</Text>
                  </View>
                  <Text className="mt-3 leading-5 text-slate-600">{booking.description}</Text>

                  {actions.length > 0 ? (
                    <View className="mt-4 flex-row gap-3">
                      {actions.map((action) => (
                        <Pressable
                          key={action.status}
                          disabled={updateStatus.isPending}
                          onPress={() => runAction(booking, action)}
                          className={`h-12 flex-1 items-center justify-center rounded-2xl ${action.destructive ? 'border border-slate-200 bg-white' : 'bg-brand'} ${updateStatus.isPending ? 'opacity-60' : ''}`}
                        >
                          <Text className={`font-bold ${action.destructive ? 'text-red-500' : 'text-white'}`}>{action.label}</Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}

                  {isCompletedForCustomer && reviewed === false ? (
                    <Pressable
                      onPress={() => router.push({ pathname: '/review', params: { bookingId: booking.id } })}
                      className="mt-4 h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-brand"
                    >
                      <Star size={18} color="white" />
                      <Text className="font-bold text-white">Leave a review</Text>
                    </Pressable>
                  ) : isCompletedForCustomer && reviewed ? (
                    <View className="mt-4 flex-row items-center gap-2">
                      <Star size={16} color="#F97316" fill="#F97316" />
                      <Text className="font-semibold text-slate-500">You reviewed this job</Text>
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
    <Pressable onPress={onPress} className={`h-11 flex-1 items-center justify-center rounded-xl ${active ? 'bg-brand' : ''}`}>
      <Text className={`font-bold ${active ? 'text-white' : 'text-slate-500'}`}>{label}</Text>
    </Pressable>
  );
}
