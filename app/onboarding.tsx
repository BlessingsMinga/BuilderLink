import { router } from 'expo-router';
import { BadgeCheck, MapPin, Star } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { AppButton } from '@/shared/components/app-button';
import { BrandMark } from '@/shared/components/brand-mark';
import { Screen } from '@/shared/components/screen';
import { useThemeColors } from '@/shared/theme';

export default function Onboarding() {
  const colors = useThemeColors();
  return (
    <Screen
      hero={
        <View className="pb-6 pt-6">
          <BrandMark onHero />
          <Text className="mt-8 font-heading text-3xl text-white">Build with people you can trust.</Text>
          <Text className="mt-3 font-body text-base text-white/80">
            Find verified construction professionals across Malawi.
          </Text>
        </View>
      }
      footer={
        <View className="gap-3">
          <AppButton label="Get started" onPress={() => router.push('/register')} />
          <AppButton label="I already have an account" variant="outline" onPress={() => router.push('/login')} />
        </View>
      }
    >
      <View className="mt-3 gap-5">
        <Benefit icon={<BadgeCheck size={24} color={colors.brand} />} title="Verified professionals" text="Know who you are hiring." />
        <Benefit icon={<Star size={24} color={colors.brand} />} title="Reviews from real jobs" text="Only customers who booked can review." />
        <Benefit icon={<MapPin size={24} color={colors.brand} />} title="Built for Malawi" text="Search by trade and district." />
      </View>
    </Screen>
  );
}

function Benefit({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <View className="flex-row items-center gap-4">
      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft">{icon}</View>
      <View className="flex-1">
        <Text className="font-bold text-base text-ink">{title}</Text>
        <Text className="font-body text-sm text-muted">{text}</Text>
      </View>
    </View>
  );
}
