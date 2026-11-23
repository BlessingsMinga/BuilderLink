import { router } from 'expo-router';
import { BadgeCheck, CalendarCheck, MessageCircle, type LucideIcon } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '@/shared/components/app-button';
import { BrandMark } from '@/shared/components/brand-mark';
import { CONTENT_MAX_WIDTH, useLayout } from '@/shared/hooks/use-layout';
import { useThemeColors } from '@/shared/theme';

const FEATURES: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: BadgeCheck, title: 'Verified builders', text: 'Every profile is checked before customers can book it.' },
  { icon: CalendarCheck, title: 'Book in a few taps', text: 'Pick a date and follow each step until the job is done.' },
  { icon: MessageCircle, title: 'Agree the details in chat', text: 'Message your builder, share photos and settle the price.' },
];

/** First screen for signed-out visitors: what the app does and one clear action. */
export default function Onboarding() {
  const colors = useThemeColors();
  const { isCompact, isShort } = useLayout();

  return (
    <View className="flex-1 bg-canvas">
      <SafeAreaView className="flex-1">
        <ScrollView contentContainerClassName="flex-grow px-5 pb-6" showsVerticalScrollIndicator={false}>
          <View style={{ width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' }} className="flex-grow">
            <View className={`flex-row items-center gap-3 ${isShort ? 'pt-4' : 'pt-6'}`}>
              <BrandMark />
              <Text className="font-heading text-xl text-ink">BuilderLink</Text>
            </View>

            <View className={`flex-row flex-wrap gap-2 ${isShort ? 'mt-8' : 'mt-12'}`}>
              <View className="flex-row items-center gap-1.5 rounded-[10px] bg-brand-soft px-2.5 py-1.5">
                <View className="h-1.5 w-1.5 rounded-full bg-primary" />
                <Text className="font-semibold text-xs text-brand">Verified builders</Text>
              </View>
              <View className="rounded-[10px] bg-subtle px-2.5 py-1.5">
                <Text className="font-medium text-xs text-ink">Lilongwe · Blantyre · Mzuzu</Text>
              </View>
            </View>

            <Text
              accessibilityRole="header"
              className={`mt-5 font-heading tracking-tight text-ink ${isCompact ? 'text-[34px] leading-[38px]' : 'text-[42px] leading-[46px]'}`}
            >
              Find a builder{'\n'}
              <Text className="text-brand">you can trust.</Text>
            </Text>
            <Text className="mt-4 font-body text-base text-muted">
              Compare portfolios and reviews, book the job, and agree the details in chat. All in one place.
            </Text>

            <View className="mt-8 gap-3.5 rounded-[22px] border border-line bg-surface p-[18px]">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <View key={title} className="flex-row items-center gap-3.5">
                  <View className="h-11 w-11 items-center justify-center rounded-2xl bg-canvas">
                    <Icon size={22} color={colors.brand} strokeWidth={1.8} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-sm text-ink">{title}</Text>
                    <Text className="font-body text-xs text-muted">{text}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Pushes the buttons to the bottom on tall screens. */}
            <View className="min-h-8 flex-grow" />

            <View className="gap-3">
              <AppButton label="Get started" onPress={() => router.push('/register')} />
              <Pressable
                accessibilityRole="link"
                onPress={() => router.push('/login')}
                className="h-12 flex-row items-center justify-center active:opacity-70"
              >
                <Text className="font-body text-sm text-muted">
                  Already have an account? <Text className="font-semibold text-brand">Log in</Text>
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
