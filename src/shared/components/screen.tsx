import { useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback, type ReactNode } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/shared/theme';

type Props = {
  children: ReactNode;
  /** Fixed bar above the scrolling content, usually a `<ScreenHeader />`. */
  header?: ReactNode;
  /**
   * Content for the coloured band at the top of the screen (title, search,
   * summary). It scrolls with the page and runs up under the status bar.
   * Text inside it should be white.
   */
  hero?: ReactNode;
  /** Pinned below the scrolling content. Use for the screen's one primary action. */
  footer?: ReactNode;
  /** Enables pull-to-refresh. */
  onRefresh?: () => void;
  refreshing?: boolean;
};

/** Page scaffold: safe area, 20pt gutters, scrolling body, optional header, hero and pinned footer. */
export function Screen({ children, header, hero, footer, onRefresh, refreshing = false }: Props) {
  const colors = useThemeColors();
  const hasHero = Boolean(hero);

  // White status bar icons while a hero screen is in front; back to automatic after.
  useFocusEffect(
    useCallback(() => {
      if (!hasHero) return undefined;
      setStatusBarStyle('light');
      return () => setStatusBarStyle('auto');
    }, [hasHero]),
  );

  return (
    <View className="flex-1 bg-canvas">
      {/* Spacer behind the status bar, coloured to match what sits below it. */}
      <SafeAreaView edges={['top']} className={hasHero ? 'bg-hero' : 'bg-canvas'} />
      <SafeAreaView edges={['left', 'right', 'bottom']} className="flex-1">
        {header ? <View className={hasHero ? 'bg-hero' : ''}>{header}</View> : null}
        <ScrollView
          contentContainerClassName="flex-grow"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.muted}
                colors={[colors.brand]}
                progressBackgroundColor={colors.surface}
              />
            ) : undefined
          }
        >
          {hero ? <View className={`rounded-b-3xl bg-hero px-5 pb-6 ${header ? 'pt-1' : 'pt-4'}`}>{hero}</View> : null}
          <View className={`flex-grow px-5 pb-6 ${header && !hero ? 'pt-2' : 'pt-5'}`}>{children}</View>
        </ScrollView>
        {footer ? <View className="border-t border-line bg-surface px-5 py-3">{footer}</View> : null}
      </SafeAreaView>
    </View>
  );
}
