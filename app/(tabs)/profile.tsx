import { router, type Href } from 'expo-router';
import { BriefcaseBusiness, CalendarDays, ChevronRight, Heart, LogOut, UserPen } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ROLE_LABELS, useProfile } from '@/features/authentication/hooks/use-profile';
import { authService } from '@/features/authentication/services/auth-service';
import { useAuthStore } from '@/features/authentication/store/auth-store';
import { Avatar } from '@/shared/components/chip';
import { Screen } from '@/shared/components/screen';
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
    <Screen
      refreshing={profile.isRefetching}
      onRefresh={profile.refetch}
      hero={
        <>
          <Text accessibilityRole="header" className="font-heading text-[34px] leading-[38px] tracking-tight text-ink">
            Profile
          </Text>
        </>
      }
    >
      <View className="mb-4 flex-row items-center gap-4 rounded-[22px] border border-line bg-surface p-[18px]">
        <Avatar name={profile.isLoading ? '' : name} shape={session?.role === 'builder' ? 'tile' : 'circle'} photoUrl={profile.data?.avatarUrl} />
        <View className="flex-1">
          <Text numberOfLines={1} className="font-heading text-xl text-ink">
            {profile.isLoading ? ' ' : name}
          </Text>
          {session?.email ? (
            <Text numberOfLines={1} className="font-body text-sm text-muted">
              {session.email}
            </Text>
          ) : null}
          {session ? (
            <View className="mt-2 self-start rounded-full bg-brand-soft px-2.5 py-1">
              <Text className="font-bold text-xs text-brand">{ROLE_LABELS[session.role]}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View className="overflow-hidden rounded-[22px] border border-line bg-surface">
        <Row icon={<UserPen size={20} color={colors.brand} />} label="Edit profile" onPress={() => router.push('/edit-profile' as Href)} />
        <Row
          divider
          icon={<CalendarDays size={20} color={colors.brand} />}
          label="My bookings"
          onPress={() => router.push('/(tabs)/bookings' as never)}
        />
        <Row divider icon={<Heart size={20} color={colors.brand} />} label="Saved professionals" onPress={() => router.push('/saved' as Href)} />
        {session?.role === 'builder' ? (
          <Row
            divider
            icon={<BriefcaseBusiness size={20} color={colors.brand} />}
            label="Builder workspace"
            onPress={() => router.push('/builder-profile')}
          />
        ) : null}
      </View>

      <Pressable
        onPress={handleSignOut}
        className="mt-4 h-16 flex-row items-center gap-4 rounded-[22px] border border-line bg-surface px-4 active:bg-subtle"
      >
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-danger-soft">
          <LogOut size={20} color={colors.danger} />
        </View>
        <Text className="font-semibold text-base text-danger">Sign out</Text>
      </Pressable>
    </Screen>
  );
}

function Row({ icon, label, onPress, divider = false }: { icon: ReactNode; label: string; onPress: () => void; divider?: boolean }) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      className={`h-16 flex-row items-center gap-4 px-4 active:bg-subtle ${divider ? 'border-t border-line' : ''}`}
    >
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-brand-soft">{icon}</View>
      <Text className="flex-1 font-semibold text-base text-ink">{label}</Text>
      <ChevronRight size={20} color={colors.faint} />
    </Pressable>
  );
}
