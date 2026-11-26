import { router, type Href } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import {
  awaitsCustomer,
  formatMoney,
  type Booking,
  type BookingPerspective,
  type BookingStatus,
} from '../services/booking-service';

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
    <View className={`rounded-[10px] px-2.5 py-1.5 ${style.badge}`}>
      <Text className={`font-semibold text-xs ${style.text}`}>{style.label}</Text>
    </View>
  );
}

/** The four steps every booking moves through, shown on the card and the detail screen. */
export const BOOKING_STEPS = ['Request sent', 'Builder confirms', 'On site', 'Job done & review'] as const;

/** How many of BOOKING_STEPS are done; null when the booking was declined or cancelled. */
export function completedSteps(status: BookingStatus): number | null {
  if (status === 'pending') return 1;
  if (status === 'accepted') return 2;
  if (status === 'completed') return 4;
  return null;
}

/** A short line under the progress bar describing where the booking stands. */
function progressLine(booking: Booking, perspective: BookingPerspective): string {
  switch (booking.status) {
    case 'pending':
      return perspective === 'customer' ? 'Request sent · waiting for the builder to confirm' : 'New request · waiting for your answer';
    case 'accepted':
      return 'Confirmed · see you on site';
    case 'completed':
      return 'Job done';
    case 'declined':
      return 'Request declined';
    case 'cancelled':
      return 'Booking cancelled';
  }
}

/** The booking's date as a small calendar tile: month over day number. */
function DateTile({ isoDate }: { isoDate: string }) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const monthLabel = new Date(year, month - 1, day).toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
  return (
    <View className="h-[60px] w-14 items-center justify-center rounded-[14px] bg-canvas">
      <Text className="font-semibold text-xs tracking-widest text-muted">{monthLabel}</Text>
      <Text className="font-heading text-2xl leading-7 text-ink">{day}</Text>
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

/** Booking summary with a progress bar. Tapping opens the booking's detail screen. */
export function BookingCard({ booking, perspective, hint: givenHint }: Props) {
  // A counter-offer needs its own prompt whichever group the card is shown in.
  const hint = awaitsCustomer(booking)
    ? perspective === 'customer'
      ? booking.quoteStatus === 'sent'
        ? `Quote received: ${formatMoney(booking.quote?.total ?? 0)}, tap to reply`
        : 'New date proposed, tap to reply'
      : 'Waiting for the customer to agree'
    : booking.status === 'pending' && booking.quoteStatus === 'revision_requested' && perspective === 'builder'
      ? 'Customer asked for a revised quote'
      : givenHint;
  const done = completedSteps(booking.status);
  return (
    <Pressable
      onPress={() => router.push(`/bookings/${booking.id}` as Href)}
      className="gap-4 rounded-[22px] border border-line bg-surface p-[18px] active:opacity-80"
    >
      <View className="flex-row items-center gap-3.5">
        <DateTile isoDate={booking.preferredDate} />
        <View className="flex-1">
          <Text numberOfLines={1} className="font-semibold text-base text-ink">
            {perspective === 'builder' ? booking.customerName : booking.builderName}
          </Text>
          <Text numberOfLines={1} className="font-body text-xs text-muted">
            {booking.service}
          </Text>
        </View>
        <StatusBadge status={booking.status} />
      </View>
      <View className="gap-2">
        {done !== null ? (
          <View className="flex-row gap-1" accessible accessibilityLabel={`Step ${done} of ${BOOKING_STEPS.length}`}>
            {BOOKING_STEPS.map((step, index) => (
              <View key={step} className={`h-1 flex-1 rounded-full ${index < done ? 'bg-primary' : 'bg-line'}`} />
            ))}
          </View>
        ) : null}
        <Text className={`text-xs ${hint ? 'font-semibold text-brand' : 'font-body text-muted'}`}>{hint ?? progressLine(booking, perspective)}</Text>
      </View>
    </Pressable>
  );
}
