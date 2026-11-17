import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { BrandMark } from '@/shared/components/brand-mark';
import { Screen } from '@/shared/components/screen';
import { ScreenHeader } from '@/shared/components/screen-header';
import { useThemeColors } from '@/shared/theme';

export default function Register() {
  return (
    <Screen header={<ScreenHeader />}>
      <BrandMark />
      <Text className="mt-8 font-heading text-3xl text-ink">Join BuilderLink</Text>
      <Text className="mt-2 font-body text-base text-muted">How do you want to use BuilderLink?</Text>

      <View className="mt-8 gap-3">
        <RoleCard
          title="I need a professional"
          description="Find trusted builders for your project."
          onPress={() => router.push('/register/customer')}
        />
        <RoleCard
          title="I am a construction professional"
          description="Grow your business and find new clients."
          onPress={() => router.push('/register/builder')}
        />
      </View>

      <Text className="mt-8 text-center font-body text-base text-muted">
        Already registered?{' '}
        <Text className="font-semibold text-brand" onPress={() => router.push('/login')}>
          Sign in
        </Text>
      </Text>
    </Screen>
  );
}

/** The whole card is the button. */
function RoleCard({ title, description, onPress }: { title: string; description: string; onPress: () => void }) {
  const colors = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl border border-line bg-surface p-4 active:bg-subtle"
    >
      <View className="flex-1">
        <Text className="font-semibold text-base text-ink">{title}</Text>
        <Text className="mt-1 font-body text-sm text-muted">{description}</Text>
      </View>
      <ChevronRight color={colors.faint} size={20} />
    </Pressable>
  );
}
