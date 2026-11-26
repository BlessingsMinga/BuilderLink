// NOT DEPLOYED. The project stays on the free Spark plan, so this logic now
// runs in the app instead (push-service, chat-service, booking-service,
// review-service), guarded by firestore.rules. Deploying these triggers as
// they are would double every notification and stat update; remove the
// app-side copies first if you ever move back to Cloud Functions (Blaze).
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { setGlobalOptions } from 'firebase-functions/v2';
import { onDocumentCreated, onDocumentUpdated, onDocumentWritten } from 'firebase-functions/v2/firestore';

// Triggers must run in the same region as the named database.
const DATABASE = 'builderlink';
setGlobalOptions({ region: 'europe-west1', maxInstances: 10 });

initializeApp();
const db = getFirestore(DATABASE);

type Booking = {
  customer_id: string;
  builder_id: string;
  customer_name: string;
  builder_name: string;
  service: string;
  preferred_date: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed';
  proposed_date?: string | null;
  quote_amount?: number | null;
  decline_reason?: string | null;
  cancel_reason?: string | null;
  quote?: { items: { label: string; amount: number }[]; total: number; note?: string | null } | null;
  quote_status?: 'sent' | 'accepted' | 'revision_requested' | null;
  quote_feedback?: string | null;
  created_at?: FirebaseFirestore.Timestamp | null;
};

// ---------------------------------------------------------------
// Push notifications (Expo push service)
// ---------------------------------------------------------------

type Push = { title: string; body: string; data: Record<string, string> };

/** Send a push to every device registered for a user. Never throws. */
async function notify(userId: string, push: Push): Promise<void> {
  try {
    const ref = db.collection('push_tokens').doc(userId);
    const snapshot = await ref.get();
    const tokens = (snapshot.data()?.tokens as string[] | undefined) ?? [];
    if (tokens.length === 0) return;

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(tokens.map((to) => ({ to, sound: 'default', ...push }))),
    });
    const result = (await response.json()) as { data?: { status: string; details?: { error?: string } }[] };

    // Forget tokens for uninstalled apps so we stop sending to them.
    const dead = tokens.filter((_, index) => result.data?.[index]?.details?.error === 'DeviceNotRegistered');
    if (dead.length > 0) await ref.update({ tokens: FieldValue.arrayRemove(...dead) });
  } catch (error) {
    logger.warn('Push notification failed', { userId, error });
  }
}

const formatDate = (iso: string) => {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
};

const formatMoney = (amount: number) => `MWK ${amount.toLocaleString('en-GB')}`;

// ---------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------

export const onBookingCreated = onDocumentCreated({ document: 'bookings/{bookingId}', database: DATABASE }, async (event) => {
  const booking = event.data?.data() as Booking | undefined;
  if (!booking) return;
  await notify(booking.builder_id, {
    title: 'New booking request',
    body: `${booking.customer_name} needs a ${booking.service.toLowerCase()} on ${formatDate(booking.preferred_date)}.`,
    data: { bookingId: event.params.bookingId },
  });
});

export const onBookingUpdated = onDocumentUpdated({ document: 'bookings/{bookingId}', database: DATABASE }, async (event) => {
  const before = event.data?.before.data() as Booking | undefined;
  const after = event.data?.after.data() as Booking | undefined;
  if (!before || !after) return;
  const bookingId = event.params.bookingId;
  const data = { bookingId };
  const tasks: Promise<unknown>[] = [];

  // Keep the inbox in step so closed jobs show as read-only there too.
  if (before.status !== after.status) {
    tasks.push(
      db
        .collection('conversations')
        .doc(bookingId)
        .update({ status: after.status })
        .catch(() => undefined), // No conversation yet: nothing to sync.
    );
  }

  const proposedNow = !before.proposed_date && Boolean(after.proposed_date);
  // The customer picked a new date; the booking waits for the builder again.
  const rescheduled = after.status === 'pending' && after.preferred_date !== before.preferred_date;

  const quoteSentNow = after.quote_status === 'sent' && JSON.stringify(after.quote) !== JSON.stringify(before.quote);
  const quoteRevisionRequested = before.quote_status === 'sent' && after.quote_status === 'revision_requested';

  // The builder's first reply to a request: accept, decline, a counter-offer or a quote.
  const firstReply =
    before.status === 'pending' &&
    !before.proposed_date &&
    !before.quote &&
    (after.status !== 'pending' || proposedNow || quoteSentNow);
  if (firstReply && after.status !== 'cancelled' && before.created_at) {
    const minutes = Math.max(0, Math.round((Date.now() - before.created_at.toMillis()) / 60_000));
    tasks.push(recordResponseTime(after.builder_id, minutes));
  }

  if (rescheduled) {
    tasks.push(
      notify(after.builder_id, {
        title: 'Booking moved',
        body: `${after.customer_name} moved their ${after.service.toLowerCase()} booking to ${formatDate(after.preferred_date)}. Please confirm.`,
        data,
      }),
    );
  } else if (before.status !== after.status) {
    switch (after.status) {
      case 'accepted':
        if (before.quote_status === 'sent' && after.quote) {
          tasks.push(
            notify(after.builder_id, {
              title: 'Quote accepted',
              body: `${after.customer_name} accepted your ${formatMoney(after.quote.total)} quote. The job is confirmed for ${formatDate(after.preferred_date)}.`,
              data,
            }),
          );
        } else if (before.proposed_date) {
          tasks.push(
            notify(after.builder_id, {
              title: 'New date agreed',
              body: `${after.customer_name} agreed to ${formatDate(after.preferred_date)}. The job is confirmed.`,
              data,
            }),
          );
        } else {
          const quote = after.quote_amount != null ? ` Quote: ${formatMoney(after.quote_amount)}.` : '';
          tasks.push(
            notify(after.customer_id, {
              title: 'Booking accepted',
              body: `${after.builder_name} accepted your ${after.service.toLowerCase()} request.${quote}`,
              data,
            }),
          );
        }
        break;
      case 'declined':
        tasks.push(
          notify(after.customer_id, {
            title: 'Booking declined',
            body: after.decline_reason
              ? `${after.builder_name} declined: “${after.decline_reason}”`
              : `${after.builder_name} can’t take this job. Try another professional.`,
            data,
          }),
        );
        break;
      case 'cancelled':
        tasks.push(
          notify(after.builder_id, {
            title: 'Booking cancelled',
            body: after.cancel_reason
              ? `${after.customer_name} cancelled: “${after.cancel_reason}”`
              : `${after.customer_name} cancelled their booking.`,
            data,
          }),
        );
        break;
      case 'completed':
        tasks.push(
          db
            .collection('builders')
            .doc(after.builder_id)
            .update({ completed_jobs: FieldValue.increment(1) }),
          notify(after.customer_id, {
            title: 'Job completed',
            body: `${after.builder_name} marked the job as done. Leave a review to help others.`,
            data,
          }),
        );
        break;
    }
  } else if (quoteSentNow && after.quote) {
    const when = after.proposed_date ? ` for ${formatDate(after.proposed_date)}` : '';
    tasks.push(
      notify(after.customer_id, {
        title: before.quote ? 'Quote updated' : 'New quote',
        body: `${after.builder_name} quoted ${formatMoney(after.quote.total)}${when}. Tap to review and accept.`,
        data,
      }),
    );
  } else if (quoteRevisionRequested) {
    tasks.push(
      notify(after.builder_id, {
        title: 'Quote changes requested',
        body: after.quote_feedback
          ? `${after.customer_name}: “${after.quote_feedback}”`
          : `${after.customer_name} asked you to revise your quote.`,
        data,
      }),
    );
  } else if (proposedNow && after.proposed_date) {
    const quote = after.quote_amount != null ? ` Quote: ${formatMoney(after.quote_amount)}.` : '';
    tasks.push(
      notify(after.customer_id, {
        title: 'New date proposed',
        body: `${after.builder_name} can do ${formatDate(after.proposed_date)} instead.${quote}`,
        data,
      }),
    );
  }

  await Promise.all(tasks);
});

/** Keep a running average of how fast the builder replies to new requests. */
async function recordResponseTime(builderId: string, minutes: number): Promise<void> {
  const ref = db.collection('builders').doc(builderId);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) return;
    const count = (snapshot.get('response_count') as number | undefined) ?? 0;
    const average = (snapshot.get('response_time_minutes') as number | null | undefined) ?? 0;
    transaction.update(ref, {
      response_time_minutes: Math.round((average * count + minutes) / (count + 1)),
      response_count: count + 1,
    });
  });
}

// ---------------------------------------------------------------
// Verification checks shown on the public profile
// ---------------------------------------------------------------

/**
 * When an administrator approves or rejects a verification document, copy the
 * approved document types (plus a verified phone number) onto the builder's
 * public listing as `checks`. Builders can't write this field themselves.
 */
export const onBuilderDocumentWritten = onDocumentWritten(
  { document: 'builder_documents/{documentId}', database: DATABASE },
  async (event) => {
    const builderId = (event.data?.after.data() ?? event.data?.before.data())?.builder_id as string | undefined;
    if (!builderId) return;
    const builderRef = db.collection('builders').doc(builderId);
    const [documents, user, builder] = await Promise.all([
      db.collection('builder_documents').where('builder_id', '==', builderId).where('review_status', '==', 'approved').get(),
      // Firebase Auth only sets phoneNumber after an SMS code is confirmed.
      getAuth().getUser(builderId).catch(() => null),
      builderRef.get(),
    ]);
    if (!builder.exists) return;
    const checks = new Set<string>(documents.docs.map((document) => document.get('type') as string));
    if (user?.phoneNumber) checks.add('phone');
    await builderRef.update({ checks: [...checks].sort() });
  },
);

// ---------------------------------------------------------------
// Chat
// ---------------------------------------------------------------

export const onMessageCreated = onDocumentCreated(
  { document: 'bookings/{bookingId}/messages/{messageId}', database: DATABASE },
  async (event) => {
    const message = event.data?.data() as { sender_id: string; text: string; image_url?: string } | undefined;
    if (!message) return;
    const bookingSnapshot = await db.collection('bookings').doc(event.params.bookingId).get();
    const booking = bookingSnapshot.data() as Booking | undefined;
    if (!booking) return;
    const fromCustomer = message.sender_id === booking.customer_id;
    const text = message.text.length > 120 ? `${message.text.slice(0, 117)}…` : message.text;
    const preview = message.image_url ? (text ? `📷 ${text}` : '📷 Photo') : text;
    const recipientId = fromCustomer ? booking.builder_id : booking.customer_id;
    // Inbox summary. Only this function writes it; clients may only reset
    // their own unread count and read marker (see firestore.rules).
    await db
      .collection('conversations')
      .doc(event.params.bookingId)
      .set(
        {
          participants: [booking.customer_id, booking.builder_id],
          customer_id: booking.customer_id,
          builder_id: booking.builder_id,
          customer_name: booking.customer_name,
          builder_name: booking.builder_name,
          service: booking.service,
          status: booking.status,
          last_message: preview,
          last_sender_id: message.sender_id,
          last_message_at: event.data?.get('created_at') ?? FieldValue.serverTimestamp(),
          unread: { [recipientId]: FieldValue.increment(1), [message.sender_id]: 0 },
        },
        { merge: true },
      )
      .catch((error) => logger.error('Updating conversation failed', error));
    await notify(fromCustomer ? booking.builder_id : booking.customer_id, {
      title: fromCustomer ? booking.customer_name : booking.builder_name,
      body: preview,
      data: { bookingId: event.params.bookingId, chat: '1' },
    });
  },
);

// ---------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------

export const onReviewCreated = onDocumentCreated({ document: 'reviews/{reviewId}', database: DATABASE }, async (event) => {
  const review = event.data?.data() as { builder_id: string; customer_name: string; rating: number } | undefined;
  if (!review) return;

  // Recalculate from every review so the figure can't drift.
  const reviews = await db.collection('reviews').where('builder_id', '==', review.builder_id).get();
  const ratings = reviews.docs.map((doc) => doc.get('rating') as number);
  const average = ratings.length ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length : 0;

  await Promise.all([
    db
      .collection('builders')
      .doc(review.builder_id)
      .update({ average_rating: Math.round(average * 10) / 10 }),
    notify(review.builder_id, {
      title: 'New review',
      body: `${review.customer_name} rated you ${review.rating} out of 5.`,
      data: { reviewId: event.params.reviewId },
    }),
  ]);
});
