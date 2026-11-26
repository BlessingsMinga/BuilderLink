import { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBookings } from '@/features/bookings/hooks/use-bookings';
import { formatBookingDate } from '@/features/bookings/services/booking-service';
import { AppButton } from '@/shared/components/app-button';
import { Chip } from '@/shared/components/chip';
import { FormField } from '@/shared/components/form-field';
import type { PhotoDetails, PhotoKind } from '../services/portfolio-service';

type Props = {
  visible: boolean;
  builderId: string;
  /** Local or remote image shown at the top. */
  previewUri: string | null;
  initial: PhotoDetails;
  title: string;
  submitLabel: string;
  busy: boolean;
  onSubmit: (details: PhotoDetails) => void;
  onClose: () => void;
};

const KINDS: { value: PhotoKind | null; label: string }[] = [
  { value: null, label: 'Just a photo' },
  { value: 'before', label: 'Before' },
  { value: 'after', label: 'After' },
];

/** Caption, before/after label and the completed job a work photo belongs to. */
export function PhotoDetailsSheet({ visible, builderId, previewUri, initial, title, submitLabel, busy, onSubmit, onClose }: Props) {
  const [caption, setCaption] = useState(initial.caption);
  const [kind, setKind] = useState<PhotoKind | null>(initial.kind);
  const [bookingId, setBookingId] = useState<string | null>(initial.bookingId);
  const jobs = useBookings(visible ? builderId : undefined, 'builder');
  const completed = (jobs.data ?? []).filter((booking) => booking.status === 'completed');

  useEffect(() => {
    if (!visible) return;
    setCaption(initial.caption);
    setKind(initial.kind);
    setBookingId(initial.bookingId);
  }, [visible, initial]);

  const submit = () => {
    const job = completed.find((booking) => booking.id === bookingId);
    onSubmit({ caption, kind, bookingId: job ? job.id : null, service: job?.service ?? null });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-canvas">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
          <ScrollView contentContainerClassName="gap-6 p-5" keyboardShouldPersistTaps="handled">
            <Text accessibilityRole="header" className="font-heading text-2xl text-ink">
              {title}
            </Text>
            {previewUri ? <Image source={{ uri: previewUri }} className="h-56 w-full rounded-2xl bg-subtle" resizeMode="cover" /> : null}

            <FormField
              label="Caption (optional)"
              value={caption}
              onChangeText={setCaption}
              placeholder="e.g. New kitchen tiling in Area 47"
              maxLength={200}
            />

            <View className="gap-2">
              <Text className="font-medium text-sm text-ink">Label</Text>
              <View className="flex-row flex-wrap gap-2">
                {KINDS.map((item) => (
                  <Chip key={item.label} label={item.label} selected={kind === item.value} onPress={() => setKind(item.value)} />
                ))}
              </View>
            </View>

            <View className="gap-2">
              <Text className="font-medium text-sm text-ink">From a BuilderLink job (optional)</Text>
              <Text className="font-body text-sm text-muted">
                Linking a completed job shows customers a “Job done on BuilderLink” badge.
              </Text>
              {jobs.isLoading ? (
                <Text className="font-body text-sm text-muted">Loading your jobs…</Text>
              ) : completed.length === 0 ? (
                <Text className="font-body text-sm text-muted">No completed jobs yet.</Text>
              ) : (
                <View className="flex-row flex-wrap gap-2">
                  <Chip label="None" selected={bookingId === null} onPress={() => setBookingId(null)} />
                  {completed.map((booking) => (
                    <Chip
                      key={booking.id}
                      label={`${booking.service} · ${formatBookingDate(booking.preferredDate)}`}
                      selected={bookingId === booking.id}
                      onPress={() => setBookingId(booking.id)}
                    />
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
          <View className="flex-row gap-3 border-t border-line p-5">
            <View className="flex-1">
              <AppButton label="Cancel" variant="outline" disabled={busy} onPress={onClose} />
            </View>
            <View className="flex-[2]">
              <AppButton label={submitLabel} loading={busy} onPress={submit} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
