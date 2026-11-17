import { router, type Href } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { formatBookingDate, type Booking, type BookingPerspective, type BookingStatus } from '../services/booking-service';
import { useThemeColors } from '@/shared/theme';

const statusStyles: Record<BookingStatus, { label: string; badge: string; text: string }> = {
  pending: { label: 'Pending', badge: 'bg-brand-soft', text: 'text-brand' },
  accepted: { label: 'Accepted', badge: 'bg-success-soft', text: 'text-success' },
  completed: { label: 'Completed', badge: 'bg-info-soft', text: 'text-info' },
  declined: { label: 'Declined', badge: 'bg-danger-soft', text: 'text-danger' },
  cancelled: { label: 'Cancelled', badge: 'bg-subtle', text: 'text-muted' },
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  const style = statusStyles[status];
  return (
    <View className={`rounded-full px-2.5 py-1 ${style.badge}`}>
      <Text className={`font-medium text-xs ${style.text}`}>{style.label}</Text>
    </View>
  );
}

type Props = {
  booking: Booking;
  /** Whose side the viewer is on; decides which name is shown. */
  perspective: BookingPerspective;
  /** Short prompt shown when the viewer needs to act, e.g. "Respond to this request". */
  hint?: string;
};

/** Compact booking summary. Tapping opens the booking's detail screen. */
export function BookingCard({ booking, perspective, hint }: Props) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={() => router.push(`/bookings/${booking.id}` as Href)}
      className="flex-row items-center gap-3 rounded-2xl border border-line bg-surface p-4 active:bg-subtle"
    >
      <View className="flex-1 gap-1">
        <View className="flex-row items-center justify-between gap-3">
          <Text numberOfLines={1} className="flex-1 font-semibold text-base text-ink">
            {perspective === 'builder' ? booking.customerName : booking.builderName}
          </Text>
          <StatusBadge status={booking.status} />
        </View>
        <Text numberOfLines={1} className="font-body text-sm text-muted">
          {booking.service} · {formatBookingDate(booking.preferredDate)}
        </Text>
        {hint ? <Text className="font-medium text-sm text-brand">{hint}</Text> : null}
      </View>
      <ChevronRight color={colors.faint} size={20} />
    </Pressable>
  );
}
