import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createBooking,
  fetchBooking,
  fetchBookings,
  updateBookingStatus,
  type Booking,
  type BookingPerspective,
  type BookingStatus,
  type CreateBookingInput,
} from '../services/booking-service';

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

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, status }: { bookingId: string; status: BookingStatus }) =>
      updateBookingStatus(bookingId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bookingsKey }),
  });
}
