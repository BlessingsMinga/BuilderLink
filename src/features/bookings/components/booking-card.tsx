import { router, type Href } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { type Booking, type BookingPerspective, type BookingStatus } from '../services/booking-service';

const statusStyles: Record<BookingStatus, { label: string; badge: string; text: string }> = {
  pending: { label: 'Pending', badge: 'bg-warn-soft', text: 'text-warn' },
  accepted: { label: 'Accepted', badge: 'bg-success-soft', text: 'text-success' },
  completed: { label: 'Completed', badge: 'bg-info-soft', text: 'text-info' },
  declined: { label: 'Declined', badge: 'bg-danger-soft', text: 'text-danger' },
  cancelled: { label: 'Cancelled', badge: 'bg-subtle', text: 'text-muted' },
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  const style = statusStyles[status];
  return (
    <View className={`rounded-full px-3 py-1 ${style.badge}`}>
      <Text className={`font-semibold text-xs ${style.text}`}>{style.label}</Text>
    </View>
  );
}

/** The booking's date as a small calendar tile: day number over month. */
function DateTile({ isoDate }: { isoDate: string }) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const monthLabel = new Date(year, month - 1, day).toLocaleDateString('en-GB', { month: 'short' });
  return (
    <View className="h-16 w-16 items-center justify-center rounded-[18px] bg-brand-soft">
      <Text className="font-heading text-lg text-brand">{day}</Text>
      <Text className="-mt-1 font-semibold text-xs text-brand">{monthLabel}</Text>
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
export function BookingCard({ booking, perspective, hint: givenHint }: Props) {
  // A counter-offer needs its own prompt whichever group the card is shown in.
  const hint =
    booking.status === 'pending' && booking.proposedDate
      ? perspective === 'customer'
        ? 'New date proposed, tap to reply'
        : 'Waiting for the customer to agree'
      : givenHint;
  return (
    <Pressable
      onPress={() => router.push(`/bookings/${booking.id}` as Href)}
      className="flex-row items-center gap-4 rounded-3xl border border-line bg-surface p-4 active:bg-subtle"
    >
      <DateTile isoDate={booking.preferredDate} />
      <View className="flex-1">
        <Text numberOfLines={1} className="font-heading text-base text-ink">
          {perspective === 'builder' ? booking.customerName : booking.builderName}
        </Text>
        <Text numberOfLines={1} className="font-body text-sm text-muted">
          {booking.service}
        </Text>
        {hint ? <Text className="mt-1 font-semibold text-sm text-brand">{hint}</Text> : null}
      </View>
      <StatusBadge status={booking.status} />
    </Pressable>
  );
}
