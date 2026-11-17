import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  applyBookingAction,
  createBooking,
  fetchBooking,
  fetchBookings,
  type Booking,
  type BookingAction,
  type BookingPerspective,
  type CreateBookingInput,
} from '../services/booking-service';
import { sendMessage, subscribeToMessages, type ChatMessage } from '../services/chat-service';

const bookingsKey = ['bookings'] as const;

/** Bookings the user sent (as customer) or received (as builder). */
export function useBookings(userId: string | undefined, perspective: BookingPerspective) {
  return useQuery<Booking[]>({
    queryKey: [...bookingsKey, userId, perspective],
    queryFn: () => fetchBookings(userId!, perspective),
    enabled: Boolean(userId),
  });
}

/** A single booking the signed-in user is a party to. */
export function useBooking(bookingId: string | undefined) {
  return useQuery<Booking | null>({
    queryKey: [...bookingsKey, 'detail', bookingId],
    queryFn: () => fetchBooking(bookingId!),
    enabled: Boolean(bookingId),
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBookingInput) => createBooking(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bookingsKey }),
  });
}

export function useBookingAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, action }: { bookingId: string; action: BookingAction }) => applyBookingAction(bookingId, action),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bookingsKey }),
  });
}

/** Live chat for one booking, oldest message first. */
export function useBookingMessages(bookingId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[] | undefined>(undefined);
  const [error, setError] = useState<unknown>(null);
  useEffect(() => {
    if (!bookingId) return undefined;
    setError(null);
    return subscribeToMessages(bookingId, setMessages, setError);
  }, [bookingId]);
  return { messages, error, isLoading: messages === undefined && !error };
}

export function useSendMessage(bookingId: string | undefined, senderId: string | undefined) {
  return useMutation({ mutationFn: (text: string) => sendMessage(bookingId!, senderId!, text) });
}
