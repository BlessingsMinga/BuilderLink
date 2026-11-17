import { FileCheck2, ImagePlus, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Pressable, Text, View } from 'react-native';
import { useThemeColors } from '@/shared/theme';
import { failureMessage, toast } from '@/shared/components/toast';
import { ErrorState } from '@/shared/components/states';
import {
  useAddPortfolioPhoto,
  useBuilderDocuments,
  usePortfolio,
  useRemoveBuilderDocument,
  useRemovePortfolioPhoto,
  useUploadBuilderDocument,
} from '../hooks/use-portfolio';
import {
  DOCUMENT_LABELS,
  MAX_PORTFOLIO_PHOTOS,
  PhotoPermissionDenied,
  PickCancelled,
  pickPhoto,
  thumbnailUrl,
  type DocumentReviewStatus,
  type DocumentType,
} from '../services/portfolio-service';

/** Picks a photo and reports the outcome; returns null when the user backed out. */
async function choosePhoto() {
  try {
    return await pickPhoto();
  } catch (error) {
    if (error instanceof PickCancelled) return null;
    if (error instanceof PhotoPermissionDenied) {
      Alert.alert('Allow photo access', 'BuilderLink needs access to your photos to upload them.', [
        { text: 'Not now', style: 'cancel' },
        { text: 'Open settings', onPress: () => Linking.openSettings() },
      ]);
      return null;
    }
    throw error;
  }
}

const uploadMessage = (error: unknown) =>
  error instanceof Error && /5 MB|not configured/.test(error.message) ? error.message : failureMessage(error, 'upload this photo');

/** The builder's public work photos, with add and remove. */
export function PortfolioManager({ builderId }: { builderId: string }) {
  const colors = useThemeColors();
  const photos = usePortfolio(builderId);
  const add = useAddPortfolioPhoto(builderId);
  const remove = useRemovePortfolioPhoto(builderId);
  const count = photos.data?.length ?? 0;

  const onAdd = async () => {
    try {
      const asset = await choosePhoto();
      if (!asset) return;
      await add.mutateAsync(asset);
      toast.success('Photo added to your profile.');
    } catch (error) {
      console.warn('Portfolio upload failed:', error);
      toast.error(uploadMessage(error));
    }
  };

  const onRemove = (photoId: string) => {
    const photo = photos.data?.find((item) => item.id === photoId);
    if (!photo) return;
    Alert.alert('Remove photo', 'Customers will no longer see this photo.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () =>
          remove.mutate(photo, {
            onSuccess: () => toast.success('Photo removed.'),
            onError: (error) => toast.error(failureMessage(error, 'remove this photo')),
          }),
      },
    ]);
  };

  if (photos.isError) return <ErrorState error={photos.error} what="your photos" onRetry={() => photos.refetch()} />;

  return (
    <View>
      <Text className="mb-3 font-body text-sm text-muted">
        Show customers your best work. Up to {MAX_PORTFOLIO_PHOTOS} photos, 5 MB each.
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {photos.data?.map((photo) => (
          <View key={photo.id} className="h-24 w-24 overflow-hidden rounded-2xl bg-subtle">
            <Image source={{ uri: thumbnailUrl(photo.url, 300) }} className="h-full w-full" accessibilityLabel="Work photo" />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remove photo"
              onPress={() => onRemove(photo.id)}
              className="absolute right-1 top-1 h-8 w-8 items-center justify-center rounded-full bg-black/60"
            >
              <Trash2 size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        ))}
        {count < MAX_PORTFOLIO_PHOTOS ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add a work photo"
            disabled={add.isPending || photos.isLoading}
            onPress={onAdd}
            className="h-24 w-24 items-center justify-center gap-1 rounded-2xl border border-dashed border-line bg-surface active:bg-subtle"
          >
            {add.isPending || photos.isLoading ? (
              <ActivityIndicator color={colors.brand} />
            ) : (
              <>
                <ImagePlus size={22} color={colors.brand} />
                <Text className="font-semibold text-xs text-brand">Add photo</Text>
              </>
            )}
          </Pressable>
        ) : null}
      </View>
      {add.isPending ? <Text className="mt-2 font-medium text-sm text-muted">Uploading photo…</Text> : null}
    </View>
  );
}

const reviewLabels: Record<DocumentReviewStatus, { label: string; tone: string }> = {
  pending: { label: 'Waiting for review', tone: 'text-warn' },
  approved: { label: 'Approved', tone: 'text-success' },
  rejected: { label: 'Not accepted, upload a clearer photo', tone: 'text-danger' },
};

/** Private ID and certificate uploads used for verification. */
export function DocumentsManager({ builderId }: { builderId: string }) {
  const colors = useThemeColors();
  const documents = useBuilderDocuments(builderId);
  const upload = useUploadBuilderDocument(builderId);
  const remove = useRemoveBuilderDocument(builderId);
  const [uploadingType, setUploadingType] = useState<DocumentType | null>(null);

  const onUpload = async (type: DocumentType) => {
    try {
      const asset = await choosePhoto();
      if (!asset) return;
      setUploadingType(type);
      // Replace any earlier upload of the same type.
      const previous = documents.data?.filter((item) => item.type === type) ?? [];
      await upload.mutateAsync({ type, asset });
      await Promise.all(previous.map((item) => remove.mutateAsync(item)));
      toast.success(`${DOCUMENT_LABELS[type]} uploaded. We’ll review it shortly.`);
    } catch (error) {
      console.warn('Document upload failed:', error);
      toast.error(uploadMessage(error));
    } finally {
      setUploadingType(null);
    }
  };

  if (documents.isError) return <ErrorState error={documents.error} what="your documents" onRetry={() => documents.refetch()} />;

  return (
    <View>
      <Text className="mb-3 font-body text-sm text-muted">
        Only BuilderLink administrators can see these. A national ID is required for verification.
      </Text>
      <View className="overflow-hidden rounded-2xl border border-line bg-surface">
        {(Object.keys(DOCUMENT_LABELS) as DocumentType[]).map((type, index) => {
          const latest = documents.data
            ?.filter((item) => item.type === type)
            .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0))[0];
          const busy = uploadingType === type;
          return (
            <View key={type} className={`flex-row items-center gap-3 p-4 ${index > 0 ? 'border-t border-line' : ''}`}>
              <FileCheck2 size={20} color={latest ? colors.brand : colors.faint} />
              <View className="flex-1">
                <Text className="font-semibold text-base text-ink">
                  {DOCUMENT_LABELS[type]}
                  {type === 'national_id' ? <Text className="text-danger"> *</Text> : null}
                </Text>
                <Text className={`font-medium text-xs ${latest ? reviewLabels[latest.reviewStatus].tone : 'text-faint'}`}>
                  {documents.isLoading ? ' ' : latest ? reviewLabels[latest.reviewStatus].label : 'Not uploaded'}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                disabled={uploadingType !== null || documents.isLoading}
                onPress={() => onUpload(type)}
                className="h-10 min-w-20 items-center justify-center rounded-xl border border-line px-3 active:bg-subtle"
              >
                {busy ? <ActivityIndicator color={colors.brand} /> : <Text className="font-semibold text-sm text-brand">{latest ? 'Replace' : 'Upload'}</Text>}
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
