import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ImagePickerAsset } from 'expo-image-picker';
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
import { sendMessage, sendPhotoMessage, subscribeToMessages, type ChatMessage } from '../services/chat-service';
import {
  postProgressUpdate,
  subscribeToProgress,
  type NewProgressUpdate,
  type ProgressUpdate,
} from '../services/progress-service';
import { subscribeToConversation, subscribeToConversations, type Conversation } from '../services/conversation-service';

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

/** Live inbox for the signed-in user, most recent first. */
export function useConversations(userId: string | undefined) {
  const [conversations, setConversations] = useState<Conversation[] | undefined>(undefined);
  const [error, setError] = useState<unknown>(null);
  useEffect(() => {
    if (!userId) return undefined;
    setError(null);
    return subscribeToConversations(userId, setConversations, setError);
  }, [userId]);
  return { conversations, error, isLoading: conversations === undefined && !error };
}

/** Total unread messages across all chats, for the tab badge. */
export function useUnreadCount(userId: string | undefined): number {
  const { conversations } = useConversations(userId);
  if (!userId || !conversations) return 0;
  return conversations.reduce((total, item) => total + (item.unread[userId] ?? 0), 0);
}

/** Live summary of one chat; null until the first message exists. */
export function useConversation(bookingId: string | undefined) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  useEffect(() => {
    if (!bookingId) return undefined;
    return subscribeToConversation(bookingId, setConversation, (error) => console.warn('Conversation listener failed:', error));
  }, [bookingId]);
  return conversation;
}

export function useSendMessage(booking: Booking | null | undefined, senderId: string | undefined) {
  return useMutation({ mutationFn: (text: string) => sendMessage(booking!, senderId!, text) });
}

/** Live progress updates for one booking, newest first. */
export function useProgressUpdates(bookingId: string | undefined) {
  const [updates, setUpdates] = useState<ProgressUpdate[] | undefined>(undefined);
  const [error, setError] = useState<unknown>(null);
  useEffect(() => {
    if (!bookingId) return undefined;
    setError(null);
    return subscribeToProgress(bookingId, setUpdates, setError);
  }, [bookingId]);
  return { updates, error, isLoading: updates === undefined && !error };
}

export function usePostProgressUpdate(booking: Booking | null | undefined) {
  return useMutation({ mutationFn: (update: NewProgressUpdate) => postProgressUpdate(booking!, update) });
}

export function useSendPhoto(booking: Booking | null | undefined, senderId: string | undefined) {
  return useMutation({
    mutationFn: ({ asset, caption }: { asset: ImagePickerAsset; caption?: string }) =>
      sendPhotoMessage(booking!, senderId!, asset, caption),
  });
}
