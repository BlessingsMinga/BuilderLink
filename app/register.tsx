import { router, type Href } from 'expo-router';
import { Check, Home, ShieldCheck, Wrench } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { AppButton } from '@/shared/components/app-button';
import { Screen } from '@/shared/components/screen';
import { ScreenHeader } from '@/shared/components/screen-header';
import { useThemeColors } from '@/shared/theme';

type Role = 'customer' | 'builder';

/** Sign-up step 0: choose how you'll use BuilderLink. */
export default function Register() {
  const colors = useThemeColors();
  const [role, setRole] = useState<Role>('customer');

  return (
    <Screen
      header={<ScreenHeader />}
      footer={
        <AppButton
          label={`Continue as ${role === 'builder' ? 'a builder' : 'a customer'}`}
          onPress={() => router.push(`/register/${role}` as Href)}
        />
      }
    >
      <Text accessibilityRole="header" className="font-heading text-3xl text-ink">
        How will you use BuilderLink?
      </Text>
      <Text className="mt-2 font-body text-base text-muted">You can switch later from your profile.</Text>

      <View accessibilityRole="radiogroup" className="mt-7 gap-3">
        <RoleCard
          selected={role === 'customer'}
          onPress={() => setRole('customer')}
          icon={<Home size={26} color={colors.brand} />}
          title="I need a builder"
          description="Find verified professionals, book jobs and leave reviews."
        />
        <RoleCard
          selected={role === 'builder'}
          onPress={() => setRole('builder')}
          icon={<Wrench size={26} color={colors.brand} />}
          title="I am a builder"
          description="Show your work, get booking requests and grow your reputation."
        />
      </View>

      <View className="mt-5 flex-row items-start gap-3 rounded-2xl border border-line bg-surface p-4">
        <ShieldCheck size={20} color={colors.brand} />
        <Text className="flex-1 font-body text-sm leading-5 text-muted">
          Builders upload a national ID before appearing in search. Our team checks every one.
        </Text>
      </View>

      <Text className="mt-8 text-center font-body text-base text-muted">
        Already registered?{' '}
        <Text accessibilityRole="link" className="font-semibold text-brand" onPress={() => router.push('/login')}>
          Log in
        </Text>
      </Text>
    </Screen>
  );
}

type RoleCardProps = { selected: boolean; onPress: () => void; icon: ReactNode; title: string; description: string };

/** A selectable card: brand border and a filled check when chosen. */
function RoleCard({ selected, onPress, icon, title, description }: RoleCardProps) {
  const colors = useThemeColors();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${title}. ${description}`}
      onPress={onPress}
      className={`flex-row items-center gap-4 rounded-[22px] border-2 bg-surface p-4 active:opacity-90 ${selected ? 'border-primary' : 'border-line'}`}
    >
      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft">{icon}</View>
      <View className="flex-1">
        <Text className="font-bold text-lg text-ink">{title}</Text>
        <Text className="mt-1 font-body text-sm leading-5 text-muted">{description}</Text>
      </View>
      <View
        className={`h-6 w-6 items-center justify-center rounded-full ${selected ? 'bg-primary' : 'border-2 border-line'}`}
      >
        {selected ? <Check size={14} color={colors.onPrimary} strokeWidth={3.2} /> : null}
      </View>
    </Pressable>
  );
}
