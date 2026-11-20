import { router, useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandMark } from '@/shared/components/brand-mark';
import { CONTENT_MAX_WIDTH, useLayout } from '@/shared/hooks/use-layout';
import { useThemeColors } from '@/shared/theme';

/** First screen for signed-out visitors: full brand colour, one clear action. */
export default function Onboarding() {
  const colors = useThemeColors();
  const { isCompact, isShort } = useLayout();

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      return () => setStatusBarStyle('auto');
    }, []),
  );

  return (
    <View className="flex-1 overflow-hidden bg-hero">
      {/* Decorative shapes, hidden from screen readers. */}
      <View
        pointerEvents="none"
        importantForAccessibility="no-hide-descendants"
        className="absolute -right-32 top-24 h-96 w-96 rounded-full border-[56px] border-white/10"
      />
      <View
        pointerEvents="none"
        importantForAccessibility="no-hide-descendants"
        style={{ transform: [{ rotate: '18deg' }] }}
        className="absolute -left-24 top-[40%] h-52 w-52 rounded-[40px] bg-white/5"
      />

      <SafeAreaView className="flex-1">
        <ScrollView contentContainerClassName="flex-grow px-6 pb-6" showsVerticalScrollIndicator={false}>
          <View style={{ width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' }} className="flex-grow">
            <View className={`flex-row items-center gap-3 ${isShort ? 'pt-4' : 'pt-10'}`}>
              <BrandMark onHero />
              <Text className="font-heading text-xl text-white">BuilderLink</Text>
            </View>

            {/* Pushes the copy and buttons to the bottom on tall screens. */}
            <View className={`flex-grow ${isShort ? 'min-h-10' : 'min-h-24'}`} />

            <View className="flex-row flex-wrap gap-2">
              <Pill label="Verified builders" />
              <Pill label="Lilongwe · Blantyre · Mzuzu" />
            </View>
            <Text
              accessibilityRole="header"
              className={`mt-5 font-heading text-white ${isCompact ? 'text-3xl' : 'text-4xl'}`}
              style={{ letterSpacing: -1 }}
            >
              Find a builder you can trust.
            </Text>
            <Text className="mt-4 font-body text-lg leading-7 text-white/85">
              Compare portfolios and reviews, book the job, and agree the details in chat. All in one place.
            </Text>

            <View className="mt-8 gap-4">
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/register')}
                className="h-14 items-center justify-center rounded-2xl bg-white active:opacity-85"
              >
                <Text className="font-bold text-lg" style={{ color: colors.hero }}>
                  Get started
                </Text>
              </Pressable>
              <Text className="text-center font-body text-base text-white/85">
                Already have an account?{' '}
                <Text accessibilityRole="link" onPress={() => router.push('/login')} className="font-bold text-white underline">
                  Log in
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Pill({ label }: { label: string }) {
  return (
    <View className="rounded-full bg-white/15 px-3 py-1.5">
      <Text className="font-semibold text-sm text-white">{label}</Text>
    </View>
  );
}
