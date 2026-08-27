import { router } from 'expo-router';
import { BriefcaseBusiness, LogOut, Settings } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { authService } from '@/features/authentication/services/auth-service';
import { useAuthStore } from '@/features/authentication/store/auth-store';
import { Screen } from '@/shared/components/screen';

export default function Profile() {
  const session = useAuthStore((state) => state.session);
  const signOut = useAuthStore((state) => state.signOut);

  const handleSignOut = async () => {
    try {
      await authService.signOut();
    } finally {
      signOut();
      router.replace('/login');
    }
  };

  const initials = session?.email
    ? session.email.slice(0, 2).toUpperCase()
    : 'DM';

  return (
    <Screen>
      <Text className="text-2xl font-extrabold text-ink">Profile</Text>
      <View className="mt-7 rounded-3xl bg-white p-5">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-orange-100">
          <Text className="text-lg font-extrabold text-brand">{initials}</Text>
        </View>
        <Text className="mt-4 text-lg font-bold text-ink">
          {session?.email ?? 'Demo Member'}
        </Text>
        <Text className="text-slate-500">
          {session ? `${session.role} · ${session.email}` : 'Customer · Lilongwe'}
        </Text>
      </View>
      <View className="mt-5 rounded-3xl bg-white">
        <Pressable
          onPress={() => router.push('/builder-profile' as never)}
          className="flex-row items-center gap-4 border-b border-slate-100 p-5"
        >
          <BriefcaseBusiness size={20} color="#F97316" />
          <Text className="font-semibold text-ink">Builder workspace</Text>
        </Pressable>
        <Row icon={<Settings size={20} color="#1E293B" />} label="Settings" />
        <Pressable
          onPress={handleSignOut}
          className="flex-row items-center gap-4 p-5"
        >
          <LogOut size={20} color="#EF4444" />
          <Text className="font-semibold text-red-500">Sign out</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

function Row({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View className="flex-row items-center gap-4 border-b border-slate-100 p-5">
      {icon}
      <Text className="font-semibold text-ink">{label}</Text>
    </View>
  );
}