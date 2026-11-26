import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Banknote, CalendarClock, Check, ChevronRight, MapPin, MessageCircle, NotebookText, Star, Wrench } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useAuthStore } from '@/features/authentication/store/auth-store';
import { BOOKING_STEPS, StatusBadge, completedSteps } from '@/features/bookings/components/booking-card';
import { DateField } from '@/features/bookings/components/date-field';
import { useBooking, useBookingAction } from '@/features/bookings/hooks/use-bookings';
import {
  formatBookingDate,
  formatMoney,
  type Booking,
  type BookingAction,
  type BookingPerspective,
} from '@/features/bookings/services/booking-service';
import { useReviewedBookingIds } from '@/features/reviews/hooks/use-reviews';
import { AppButton } from '@/shared/components/app-button';
import { Avatar } from '@/shared/components/chip';
import { FormField } from '@/shared/components/form-field';
import { Protected } from '@/shared/components/protected';
import { Screen } from '@/shared/components/screen';
import { ScreenHeader } from '@/shared/components/screen-header';
import { Skeleton } from '@/shared/components/skeleton';
import { EmptyState, ErrorState, ErrorText } from '@/shared/components/states';
import { failureMessage, toast } from '@/shared/components/toast';
import { useThemeColors } from '@/shared/theme';

/** A reply that needs extra input before it is sent. */
type Panel = 'accept' | 'decline' | 'propose' | 'cancel' | 'reschedule';

const SUCCESS: Record<BookingAction['type'], string> = {
  accept: 'Request accepted. The customer has been notified.',
  decline: 'Request declined. The customer has been notified.',
  propose: 'New date sent. We’ll let you know when the customer replies.',
  complete: 'Job marked as completed. Nice work!',
  cancel: 'Booking cancelled.',
  acceptProposal: 'New date accepted. Your booking is confirmed.',
  reschedule: 'Booking moved. We’ll let you know when the builder confirms.',
};

/** One plain sentence telling the viewer where the booking stands and what happens next. */
function statusExplanation(booking: Booking, perspective: BookingPerspective): string {
  const other = perspective === 'builder' ? booking.customerName : booking.builderName;
  switch (booking.status) {
    case 'pending':
      if (booking.proposedDate) {
        return perspective === 'builder'
          ? `You proposed ${formatBookingDate(booking.proposedDate)}. Waiting for ${other} to agree.`
          : `${other} can’t make ${formatBookingDate(booking.preferredDate)} and proposed ${formatBookingDate(booking.proposedDate)} instead.`;
      }
      return perspective === 'builder'
        ? 'Accept, decline or propose another date. The customer is told straight away.'
        : `Waiting for ${other} to respond. We’ll notify you when they do.`;
    case 'accepted':
      return perspective === 'builder'
        ? 'You accepted this job. Mark it as completed once the work is done.'
        : `${other} accepted. Use messages to agree on the details.`;
    case 'declined':
      return perspective === 'builder' ? 'You declined this request.' : `${other} declined this request.`;
    case 'cancelled':
      return perspective === 'builder' ? `${other} cancelled this booking.` : 'You cancelled this booking.';
    case 'completed':
      return perspective === 'builder' ? 'Job completed.' : 'Job completed. Thanks for using BuilderLink.';
  }
}

export default function BookingDetail() {
  const colors = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useAuthStore((state) => state.session);
  const { data: booking, isLoading, isError, error, refetch, isRefetching } = useBooking(id);
  const reviewed = useReviewedBookingIds(session?.userId);
  const bookingAction = useBookingAction();

  const [panel, setPanel] = useState<Panel | null>(null);
  const [quote, setQuote] = useState('');
  const [reason, setReason] = useState('');
  const [proposedDate, setProposedDate] = useState<string | null>(null);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const perspective: BookingPerspective = booking?.builderId === session?.userId ? 'builder' : 'customer';
  const canReview =
    booking && perspective === 'customer' && booking.status === 'completed' && reviewed.data && !reviewed.data.includes(booking.id);
  const hasReviewed = booking && perspective === 'customer' && reviewed.data?.includes(booking.id);
  const otherName = booking ? (perspective === 'builder' ? booking.customerName : booking.builderName) : '';
  const steps = booking ? completedSteps(booking.status) : null;
  const chatOpen = booking?.status === 'pending' || booking?.status === 'accepted';

  const openPanel = (next: Panel) => {
    setPanel(next);
    setPanelError(null);
    setActionError(null);
    setQuote(booking?.quoteAmount != null ? String(booking.quoteAmount) : '');
    setReason('');
    setProposedDate(null);
  };

  const run = async (action: BookingAction) => {
    if (!booking) return;
    setActionError(null);
    try {
      await bookingAction.mutateAsync({ bookingId: booking.id, action });
      setPanel(null);
      toast.success(SUCCESS[action.type]);
    } catch (failure) {
      console.warn('Booking update failed:', failure);
      setActionError(failureMessage(failure, 'update this booking'));
    }
  };

  /** Confirm-then-run for actions that need no extra input. */
  const confirmThen = (title: string, message: string, action: BookingAction) =>
    Alert.alert(title, message, [
      { text: 'Back', style: 'cancel' },
      { text: title, onPress: () => run(action) },
    ]);

  const submitPanel = () => {
    if (!booking || !panel) return;
    setPanelError(null);
    const quoteText = quote.replace(/[\s,]/g, '');
    const quoteAmount = quoteText === '' ? null : Number(quoteText);
    if (quoteAmount !== null && (!Number.isInteger(quoteAmount) || quoteAmount < 0)) {
      setPanelError('Enter the price as a whole number of kwacha, e.g. 150000.');
      return;
    }
    if (panel === 'accept') run({ type: 'accept', quoteAmount });
    if (panel === 'decline') run({ type: 'decline', reason });
    if (panel === 'cancel') run({ type: 'cancel', reason });
    if (panel === 'propose') {
      if (!proposedDate) return setPanelError('Choose the date you can do the job.');
      if (proposedDate === booking.preferredDate) return setPanelError('Pick a different date from the one requested.');
      run({ type: 'propose', date: proposedDate, quoteAmount });
    }
    if (panel === 'reschedule') {
      if (!proposedDate) return setPanelError('Choose the new date.');
      if (proposedDate === booking.preferredDate) return setPanelError('Pick a different date from the current one.');
      run({ type: 'reschedule', date: proposedDate });
    }
  };

  const busy = bookingAction.isPending;
  let footer: ReactNode;
  if (booking && panel) {
    const confirmLabel = { accept: 'Accept request', decline: 'Decline request', propose: 'Send new date', cancel: 'Cancel booking', reschedule: 'Move booking' }[panel];
    footer = (
      <View>
        <ErrorText>{actionError}</ErrorText>
        <View className={`flex-row gap-3 ${actionError ? 'mt-3' : ''}`}>
          <View className="flex-1">
            <AppButton label="Back" variant="outline" disabled={busy} onPress={() => setPanel(null)} />
          </View>
          <View className="flex-[2]">
            <AppButton label={confirmLabel} loading={busy} onPress={submitPanel} />
          </View>
        </View>
      </View>
    );
  } else if (booking) {
    const buttons: { label: string; onPress: () => void; outline?: boolean }[] = [];
    if (perspective === 'builder' && booking.status === 'pending') {
      buttons.push({ label: 'Decline', outline: true, onPress: () => openPanel('decline') });
      if (!booking.proposedDate) buttons.push({ label: 'Other date', outline: true, onPress: () => openPanel('propose') });
      buttons.push({ label: 'Accept', onPress: () => openPanel('accept') });
    }
    if (perspective === 'builder' && booking.status === 'accepted') {
      buttons.push({
        label: 'Mark as completed',
        onPress: () => confirmThen('Mark as completed', 'Mark this job as completed? The customer will be asked for a review.', { type: 'complete' }),
      });
    }
    if (perspective === 'customer' && (booking.status === 'pending' || booking.status === 'accepted')) {
      if (booking.status === 'pending' && booking.proposedDate) {
        buttons.push({ label: 'Cancel booking', outline: true, onPress: () => openPanel('cancel') });
        const date = booking.proposedDate;
        buttons.push({
          label: 'Accept new date',
          onPress: () => confirmThen('Accept new date', `Confirm your booking for ${formatBookingDate(date)}?`, { type: 'acceptProposal', date }),
        });
      } else {
        buttons.push({ label: 'Reschedule', outline: true, onPress: () => openPanel('reschedule') });
        buttons.push({ label: 'Cancel', outline: true, onPress: () => openPanel('cancel') });
      }
    }
    if (canReview) {
      buttons.push({ label: 'Leave a review', onPress: () => router.push({ pathname: '/review', params: { bookingId: booking.id } }) });
    }
    footer =
      buttons.length > 0 ? (
        <View>
          <ErrorText>{actionError}</ErrorText>
          <View className={`flex-row gap-3 ${actionError ? 'mt-3' : ''}`}>
            {buttons.map((button) => (
              <View key={button.label} className="flex-1">
                <AppButton label={button.label} variant={button.outline ? 'outline' : 'primary'} disabled={busy} loading={busy && !button.outline} onPress={button.onPress} />
              </View>
            ))}
          </View>
        </View>
      ) : undefined;
  }

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
            <View className="self-start">
              <StatusBadge status={booking.status} />
            </View>
            <Text accessibilityRole="header" className="mt-2.5 font-heading text-3xl text-ink">
              {formatBookingDate(booking.proposedDate && booking.status === 'pending' ? booking.proposedDate : booking.preferredDate)}
            </Text>

            <Pressable
              accessibilityRole={perspective === 'customer' ? 'link' : undefined}
              disabled={perspective === 'builder'}
              onPress={() => router.push({ pathname: '/builders/[id]', params: { id: booking.builderId } })}
              className="mt-5 flex-row items-center gap-3.5 rounded-[20px] border border-line bg-surface p-4 active:opacity-80"
            >
              <Avatar name={otherName} size="sm" shape="tile" />
              <View className="flex-1">
                <Text className="font-body text-xs text-muted">{perspective === 'builder' ? 'Request from' : 'Booking with'}</Text>
                <Text numberOfLines={1} className="font-semibold text-base text-ink">
                  {otherName}
                </Text>
              </View>
              {perspective === 'customer' ? <ChevronRight size={18} color={colors.muted} /> : null}
            </Pressable>

            <View className={`mt-4 rounded-2xl p-4 ${booking.proposedDate && booking.status === 'pending' ? 'bg-warn-soft' : 'bg-subtle'}`}>
              <Text accessibilityLiveRegion="polite" className="font-medium text-sm text-ink">
                {statusExplanation(booking, perspective)}
              </Text>
              {booking.status === 'declined' && booking.declineReason ? (
                <Text className="mt-2 font-body text-sm text-muted">Reason: “{booking.declineReason}”</Text>
              ) : null}
              {booking.status === 'cancelled' && booking.cancelReason ? (
                <Text className="mt-2 font-body text-sm text-muted">Reason: “{booking.cancelReason}”</Text>
              ) : null}
            </View>

            {steps !== null ? (
              <>
                <Text accessibilityRole="header" className="mb-3.5 mt-6 font-heading text-lg text-ink">
                  Progress
                </Text>
                <ProgressSteps done={steps} />
              </>
            ) : null}

            <Text accessibilityRole="header" className="mb-2.5 mt-6 font-heading text-lg text-ink">
              Job details
            </Text>
            <View className="overflow-hidden rounded-[20px] border border-line bg-subtle">
              <Detail first icon={<Wrench size={20} color={colors.brand} />} label="Service" value={booking.service} />
              {booking.proposedDate && booking.status === 'pending' ? (
                <Detail icon={<CalendarClock size={20} color={colors.warn} />} label="First asked for" value={formatBookingDate(booking.preferredDate)} />
              ) : null}
              {booking.quoteAmount != null ? (
                <Detail icon={<Banknote size={20} color={colors.brand} />} label="Builder’s quote" value={formatMoney(booking.quoteAmount)} />
              ) : null}
              <Detail icon={<MapPin size={20} color={colors.brand} />} label="Location" value={booking.location} />
              <Detail
                icon={<NotebookText size={20} color={colors.brand} />}
                label={perspective === 'customer' ? 'Your note' : 'Customer’s note'}
                value={booking.description}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push(`/chat/${booking.id}` as Href)}
              className="mt-4 flex-row items-center gap-4 rounded-[20px] border border-line bg-surface p-4 active:opacity-80"
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-soft">
                <MessageCircle size={20} color={colors.brand} />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-base text-ink">{perspective === 'builder' ? 'Message customer' : 'Message builder'}</Text>
                <Text className="font-body text-sm text-muted">
                  {chatOpen ? `Chat with ${otherName}` : 'This booking is closed. You can read past messages.'}
                </Text>
              </View>
              <ChevronRight size={20} color={colors.faint} />
            </Pressable>

            {panel ? (
              <View className="mt-8 gap-4 rounded-2xl border border-line bg-surface p-4">
                {panel === 'accept' ? (
                  <>
                    <Text className="font-heading text-lg text-ink">Accept this request</Text>
                    <FormField
                      label="Your price in kwacha (optional)"
                      value={quote}
                      onChangeText={setQuote}
                      keyboardType="number-pad"
                      placeholder="e.g. 150000"
                      maxLength={12}
                    />
                  </>
                ) : null}
                {panel === 'propose' ? (
                  <>
                    <Text className="font-heading text-lg text-ink">Propose another date</Text>
                    <Text className="font-body text-sm text-muted">
                      {booking.customerName} asked for {formatBookingDate(booking.preferredDate)}. They can accept your date or cancel.
                    </Text>
                    <DateField value={proposedDate} onChange={setProposedDate} />
                    <FormField
                      label="Your price in kwacha (optional)"
                      value={quote}
                      onChangeText={setQuote}
                      keyboardType="number-pad"
                      placeholder="e.g. 150000"
                      maxLength={12}
                    />
                  </>
                ) : null}
                {panel === 'reschedule' ? (
                  <>
                    <Text className="font-heading text-lg text-ink">Move to another date</Text>
                    <Text className="font-body text-sm text-muted">
                      {booking.status === 'accepted'
                        ? `${booking.builderName} will need to confirm the new date again.`
                        : `${booking.builderName} will be asked to confirm the new date.`}
                    </Text>
                    <DateField value={proposedDate} onChange={setProposedDate} />
                  </>
                ) : null}
                {panel === 'decline' || panel === 'cancel' ? (
                  <>
                    <Text className="font-heading text-lg text-ink">{panel === 'decline' ? 'Decline this request' : 'Cancel this booking'}</Text>
                    <FormField
                      label={`Reason (optional, shared with ${perspective === 'builder' ? booking.customerName : booking.builderName})`}
                      value={reason}
                      onChangeText={setReason}
                      multiline
                      placeholder={panel === 'decline' ? 'e.g. Fully booked that week' : 'e.g. Plans changed'}
                      maxLength={300}
                    />
                  </>
                ) : null}
                <ErrorText>{panelError}</ErrorText>
              </View>
            ) : null}

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

function Detail({ icon, label, value, first = false }: { icon: ReactNode; label: string; value: string; first?: boolean }) {
  return (
    <View className={`flex-row gap-3 p-4 ${first ? '' : 'border-t border-line'}`}>
      <View className="mt-0.5">{icon}</View>
      <View className="flex-1 gap-0.5">
        <Text className="font-body text-xs text-muted">{label}</Text>
        <Text className="font-body text-sm text-ink">{value}</Text>
      </View>
    </View>
  );
}

/** Vertical timeline of BOOKING_STEPS: done steps filled, the current one ringed in amber. */
function ProgressSteps({ done }: { done: number }) {
  const colors = useThemeColors();
  const current = Math.min(done, BOOKING_STEPS.length - 1);
  return (
    <View accessible accessibilityLabel={done >= BOOKING_STEPS.length ? 'All steps done' : `Next step: ${BOOKING_STEPS[current]}`}>
      {BOOKING_STEPS.map((step, index) => {
        const isDone = index < done;
        const isCurrent = index === done;
        const isLast = index === BOOKING_STEPS.length - 1;
        return (
          <View key={step} className="flex-row gap-3.5">
            <View className="items-center">
              {isDone ? (
                <View className="h-6 w-6 items-center justify-center rounded-full bg-primary">
                  <Check size={14} color={colors.onPrimary} strokeWidth={3} />
                </View>
              ) : (
                <View className={`h-6 w-6 items-center justify-center rounded-full border-2 ${isCurrent ? 'border-warn' : 'border-line'}`}>
                  {isCurrent ? <View className="h-2 w-2 rounded-full bg-warn" /> : null}
                </View>
              )}
              {isLast ? null : <View className={`min-h-[28px] w-0.5 flex-1 ${isDone ? 'bg-primary' : 'bg-line'}`} />}
            </View>
            <Text className={`flex-1 font-semibold text-sm ${isLast ? '' : 'pb-[18px]'} ${isDone || isCurrent ? 'text-ink' : 'text-muted'}`}>{step}</Text>
          </View>
        );
      })}
    </View>
  );
}
