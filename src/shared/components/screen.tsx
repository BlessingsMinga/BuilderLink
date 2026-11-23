import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CONTENT_MAX_WIDTH } from '@/shared/hooks/use-layout';
import { useThemeColors } from '@/shared/theme';

const contentStyle = { width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' } as const;

type Props = {
  children: ReactNode;
  /** Fixed bar above the scrolling content, usually a `<ScreenHeader />`. */
  header?: ReactNode;
  /**
   * The page heading area (title, search, summary). It scrolls with the page.
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


  return (
    <View className="flex-1 bg-canvas">
      {/* Spacer behind the status bar, coloured to match what sits below it. */}
      <SafeAreaView edges={['top']} className="bg-canvas" />
      <SafeAreaView edges={['left', 'right', 'bottom']} className="flex-1">
        {header ? <View>{header}</View> : null}
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
          {hero ? (
            <View className={`px-5 pb-1 ${header ? 'pt-1' : 'pt-5'}`}>
              <View style={contentStyle}>{hero}</View>
            </View>
          ) : null}
          {/* Centred at a readable width on tablets and web; full width on phones. */}
          <View style={contentStyle} className={`flex-grow px-5 pb-6 ${header && !hero ? 'pt-2' : 'pt-5'}`}>
            {children}
          </View>
        </ScrollView>
        {footer ? (
          <View className="border-t border-line bg-canvas px-5 pb-4 pt-4">
            <View style={contentStyle}>{footer}</View>
          </View>
        ) : null}
      </SafeAreaView>
    </View>
  );
}
