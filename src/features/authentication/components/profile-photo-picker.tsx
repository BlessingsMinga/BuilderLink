import { Camera } from 'lucide-react-native';
import { ActivityIndicator, Alert, Linking, Pressable, Text, View } from 'react-native';
import { useProfile, useSaveProfilePhoto } from '@/features/authentication/hooks/use-profile';
import { PhotoPermissionDenied, PickCancelled, pickPhoto } from '@/features/portfolio/services/portfolio-service';
import { Avatar } from '@/shared/components/chip';
import { failureMessage, toast } from '@/shared/components/toast';
import { useThemeColors } from '@/shared/theme';

/** Large avatar with options to take, choose or remove a profile photo. Saves immediately. */
export function ProfilePhotoPicker({ userId, name, shape = 'circle' }: { userId: string; name: string; shape?: 'circle' | 'tile' }) {
  const colors = useThemeColors();
  const profile = useProfile(userId);
  const save = useSaveProfilePhoto(userId);
  const photoUrl = profile.data?.avatarUrl ?? null;

  const choose = async (source: 'library' | 'camera') => {
    try {
      const asset = await pickPhoto({ source });
      await save.mutateAsync(asset);
      toast.success('Profile photo updated.');
    } catch (error) {
      if (error instanceof PickCancelled) return;
      if (error instanceof PhotoPermissionDenied) {
        Alert.alert('Allow access', 'BuilderLink needs permission to use your photos or camera.', [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open settings', onPress: () => Linking.openSettings() },
        ]);
        return;
      }
      console.warn('Profile photo upload failed:', error);
      toast.error(error instanceof Error && /5 MB|not configured/.test(error.message) ? error.message : failureMessage(error, 'update your photo'));
    }
  };

  const remove = () =>
    save.mutate(null, {
      onSuccess: () => toast.success('Profile photo removed.'),
      onError: (error) => toast.error(failureMessage(error, 'remove your photo')),
    });

  const openMenu = () =>
    Alert.alert('Profile photo', undefined, [
      { text: 'Take a photo', onPress: () => choose('camera') },
      { text: 'Choose from library', onPress: () => choose('library') },
      ...(photoUrl ? [{ text: 'Remove photo', style: 'destructive' as const, onPress: remove }] : []),
      { text: 'Cancel', style: 'cancel' as const },
    ]);

  return (
    <View className="items-center">
      <Pressable accessibilityRole="button" accessibilityLabel="Change profile photo" disabled={save.isPending} onPress={openMenu}>
        <Avatar name={name} size="lg" shape={shape} photoUrl={photoUrl} />
        <View className="absolute -bottom-1 -right-1 h-9 w-9 items-center justify-center rounded-full border-2 border-surface bg-primary">
          {save.isPending ? <ActivityIndicator size="small" color={colors.onPrimary} /> : <Camera size={16} color={colors.onPrimary} />}
        </View>
      </Pressable>
      <Text className="mt-3 font-semibold text-sm text-brand" onPress={save.isPending ? undefined : openMenu}>
        {save.isPending ? 'Uploading…' : photoUrl ? 'Change photo' : 'Add a photo'}
      </Text>
    </View>
  );
}
