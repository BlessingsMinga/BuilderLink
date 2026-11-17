import { router, type Href } from 'expo-router';
import { BriefcaseBusiness, ChevronRight, Heart, LogOut } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ROLE_LABELS, useProfile } from '@/features/authentication/hooks/use-profile';
import { authService } from '@/features/authentication/services/auth-service';
import { useAuthStore } from '@/features/authentication/store/auth-store';
import { Avatar } from '@/shared/components/chip';
import { Screen } from '@/shared/components/screen';
import { Skeleton } from '@/shared/components/skeleton';
import { useThemeColors } from '@/shared/theme';

export default function Profile() {
  const colors = useThemeColors();
  const session = useAuthStore((state) => state.session);
  const signOut = useAuthStore((state) => state.signOut);
  const profile = useProfile(session?.userId);

  const handleSignOut = async () => {
    try {
      await authService.signOut();
    } finally {
      signOut();
      router.replace('/login');
    }
  };

  // Fall back to the sign-in identifier if the profile can't be loaded.
  const name = profile.data?.fullName ?? session?.email ?? 'BuilderLink member';

  return (
    <Screen refreshing={profile.isRefetching} onRefresh={profile.refetch}>
      <Text className="font-heading text-3xl text-ink">Profile</Text>

      <View className="mt-6 flex-row items-center gap-4">
        {profile.isLoading ? (
          <>
            <Skeleton className="h-12 w-12 rounded-full" />
            <View className="gap-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-24" />
            </View>
          </>
        ) : (
          <>
            <Avatar name={name} />
            <View className="flex-1">
              <Text numberOfLines={1} className="font-heading-semibold text-lg text-ink">
                {name}
              </Text>
              {session ? <Text className="font-body text-sm text-muted">{ROLE_LABELS[session.role]}</Text> : null}
            </View>
          </>
        )}
      </View>

      <View className="mt-8 rounded-2xl border border-line">
        <Row icon={<Heart size={20} color={colors.ink} />} label="Saved professionals" onPress={() => router.push('/saved' as Href)} />
        {session?.role === 'builder' ? (
          <Row
            icon={<BriefcaseBusiness size={20} color={colors.ink} />}
            label="Builder workspace"
            onPress={() => router.push('/builder-profile')}
          />
        ) : null}
        <Pressable onPress={handleSignOut} className="h-14 flex-row items-center gap-4 border-t border-line px-4 active:bg-subtle">
          <LogOut size={20} color={colors.danger} />
          <Text className="font-medium text-base text-danger">Sign out</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

function Row({ icon, label, onPress }: { icon: ReactNode; label: string; onPress: () => void }) {
  const colors = useThemeColors();
  return (
    <Pressable onPress={onPress} className="h-14 flex-row items-center gap-4 px-4 active:bg-subtle">
      {icon}
      <Text className="flex-1 font-medium text-base text-ink">{label}</Text>
      <ChevronRight size={20} color={colors.faint} />
    </Pressable>
  );
}
