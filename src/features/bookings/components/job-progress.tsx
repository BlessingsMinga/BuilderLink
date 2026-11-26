import type { ImagePickerAsset } from 'expo-image-picker';
import { Camera, ImagePlus, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, Image, Linking, Pressable, Text, View } from 'react-native';
import { PhotoViewer } from '@/features/portfolio/components/photo-viewer';
import {
  PhotoPermissionDenied,
  PickCancelled,
  pickPhoto,
  thumbnailUrl,
  type PortfolioPhoto,
} from '@/features/portfolio/services/portfolio-service';
import { AppButton } from '@/shared/components/app-button';
import { Chip } from '@/shared/components/chip';
import { FormField } from '@/shared/components/form-field';
import { ErrorState, ErrorText } from '@/shared/components/states';
import { failureMessage, toast } from '@/shared/components/toast';
import { useThemeColors } from '@/shared/theme';
import { usePostProgressUpdate, useProgressUpdates } from '../hooks/use-bookings';
import type { Booking, BookingPerspective } from '../services/booking-service';
import { latestPercent, type ProgressUpdate } from '../services/progress-service';

const PERCENT_OPTIONS = [25, 50, 75, 100];

const formatWhen = (date: Date | null) =>
  date
    ? date.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : 'Sending…';

type Props = { booking: Booking; perspective: BookingPerspective };

/**
 * Progress reports for a job: a completion bar, the timeline of updates and,
 * for the builder while the job is accepted, a form to post a new one.
 * Hidden entirely when there is nothing to show and nothing to do.
 */
export function JobProgress({ booking, perspective }: Props) {
  const colors = useThemeColors();
  const { updates, error, isLoading } = useProgressUpdates(booking.id);
  const post = usePostProgressUpdate(booking);
  const canPost = perspective === 'builder' && booking.status === 'accepted';

  const [composing, setComposing] = useState(false);
  const [text, setText] = useState('');
  const [asset, setAsset] = useState<ImagePickerAsset | null>(null);
  const [percent, setPercent] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [openPhoto, setOpenPhoto] = useState<number | null>(null);

  const list = updates ?? [];
  const percentDone = latestPercent(list);
  // Photos in the timeline, shaped for the shared full-screen viewer.
  const photos = useMemo<(PortfolioPhoto & { updateId: string })[]>(
    () =>
      list
        .filter((update): update is ProgressUpdate & { imageUrl: string } => Boolean(update.imageUrl))
        .map((update) => ({
          id: update.id,
          updateId: update.id,
          storagePath: update.imageUrl,
          url: update.imageUrl,
          caption: update.text || null,
          kind: null,
          bookingId: null,
          service: null,
          createdAt: update.createdAt,
        })),
    [list],
  );

  if (!canPost && !isLoading && !error && list.length === 0) return null;

  const choose = async (source: 'camera' | 'library') => {
    try {
      setAsset(await pickPhoto({ source, edit: false }));
    } catch (failure) {
      if (failure instanceof PickCancelled) return;
      if (failure instanceof PhotoPermissionDenied) {
        Alert.alert('Allow access', failure.message, [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open settings', onPress: () => Linking.openSettings() },
        ]);
        return;
      }
      toast.error(failureMessage(failure, 'open that photo'));
    }
  };

  const reset = () => {
    setComposing(false);
    setText('');
    setAsset(null);
    setPercent(null);
    setFormError(null);
  };

  const submit = async () => {
    setFormError(null);
    if (!text.trim() && !asset) return setFormError('Add a short note or a photo.');
    try {
      await post.mutateAsync({ text, asset, percent });
      toast.success(`Update posted. ${booking.customerName} has been notified.`);
      reset();
    } catch (failure) {
      console.warn('Posting progress update failed:', failure);
      setFormError(
        failure instanceof Error && /5 MB|not configured/.test(failure.message)
          ? failure.message
          : failureMessage(failure, 'post this update'),
      );
    }
  };

  return (
    <View className="mt-6">
      <View className="mb-3 flex-row items-center justify-between">
        <Text accessibilityRole="header" className="font-heading text-lg text-ink">
          Job updates
        </Text>
        {percentDone !== null ? <Text className="font-semibold text-sm text-brand">{percentDone}% done</Text> : null}
      </View>

      {percentDone !== null ? (
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: percentDone }}
          className="mb-4 h-2 overflow-hidden rounded-full bg-subtle"
        >
          <View className="h-full rounded-full bg-primary" style={{ width: `${percentDone}%` }} />
        </View>
      ) : null}

      {canPost && !composing ? (
        <View className="mb-4">
          <AppButton label="Post a progress update" variant="outline" onPress={() => setComposing(true)} />
        </View>
      ) : null}

      {composing ? (
        <View className="mb-4 gap-4 rounded-2xl border border-line bg-surface p-4">
          <Text className="font-body text-sm text-muted">
            Keep {booking.customerName} in the loop with a note and a site photo.
          </Text>
          <FormField
            label="What was done?"
            value={text}
            onChangeText={setText}
            multiline
            placeholder="e.g. Foundation poured, walls start Monday."
            maxLength={1000}
          />
          {asset ? (
            <View className="h-40 overflow-hidden rounded-2xl bg-subtle">
              <Image source={{ uri: asset.uri }} className="h-full w-full" accessibilityLabel="Selected photo" />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Remove photo"
                onPress={() => setAsset(null)}
                className="absolute right-2 top-2 h-8 w-8 items-center justify-center rounded-full bg-black/60"
              >
                <X size={16} color="#FFFFFF" />
              </Pressable>
            </View>
          ) : (
            <View className="flex-row gap-3">
              <PhotoButton icon={<Camera size={18} color={colors.brand} />} label="Take photo" onPress={() => choose('camera')} />
              <PhotoButton icon={<ImagePlus size={18} color={colors.brand} />} label="From gallery" onPress={() => choose('library')} />
            </View>
          )}
          <View className="gap-2">
            <Text className="font-medium text-sm text-ink">How far along? (optional)</Text>
            <View className="flex-row flex-wrap gap-2">
              {PERCENT_OPTIONS.map((value) => (
                <Chip
                  key={value}
                  label={`${value}%`}
                  selected={percent === value}
                  onPress={() => setPercent(percent === value ? null : value)}
                />
              ))}
            </View>
          </View>
          <ErrorText>{formError}</ErrorText>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <AppButton label="Cancel" variant="outline" disabled={post.isPending} onPress={reset} />
            </View>
            <View className="flex-[2]">
              <AppButton label="Post update" loading={post.isPending} onPress={submit} />
            </View>
          </View>
        </View>
      ) : null}

      {error ? (
        <ErrorState error={error} what="job updates" />
      ) : isLoading ? (
        <Text className="font-body text-sm text-muted">Loading updates…</Text>
      ) : list.length === 0 ? (
        <Text className="font-body text-sm text-muted">No updates yet. Post one when work starts.</Text>
      ) : (
        <View>
          {list.map((update, index) => {
            const isLast = index === list.length - 1;
            const photoIndex = photos.findIndex((photo) => photo.updateId === update.id);
            return (
              <View key={update.id} className="flex-row gap-3.5">
                <View className="items-center">
                  <View className={`mt-1 h-3 w-3 rounded-full ${index === 0 ? 'bg-primary' : 'bg-line'}`} />
                  {isLast ? null : <View className="w-0.5 flex-1 bg-line" />}
                </View>
                <View className={`flex-1 gap-2 ${isLast ? '' : 'pb-5'}`}>
                  <View className="flex-row flex-wrap items-center gap-x-2">
                    <Text className="font-medium text-xs text-muted">{formatWhen(update.createdAt)}</Text>
                    {update.percent !== null ? (
                      <Text className="font-semibold text-xs text-brand">{update.percent}% done</Text>
                    ) : null}
                  </View>
                  {update.text ? <Text className="font-body text-sm text-ink">{update.text}</Text> : null}
                  {update.imageUrl ? (
                    <Pressable
                      accessibilityRole="imagebutton"
                      accessibilityLabel="Open site photo"
                      onPress={() => setOpenPhoto(photoIndex)}
                      className="h-44 overflow-hidden rounded-2xl bg-subtle active:opacity-85"
                    >
                      <Image source={{ uri: thumbnailUrl(update.imageUrl, 800) }} className="h-full w-full" />
                    </Pressable>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      )}

      <PhotoViewer photos={photos} openIndex={openPhoto} onClose={() => setOpenPhoto(null)} />
    </View>
  );
}

function PhotoButton({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-dashed border-line py-3 active:bg-subtle"
    >
      {icon}
      <Text className="font-semibold text-sm text-brand">{label}</Text>
    </Pressable>
  );
}
