import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/shared/theme';

type Props = {
  children: ReactNode;
  /** Fixed bar above the scrolling content, usually a `<ScreenHeader />`. */
  header?: ReactNode;
  /** Pinned below the scrolling content. Use for the screen's one primary action. */
  footer?: ReactNode;
  /** Enables pull-to-refresh. */
  onRefresh?: () => void;
  refreshing?: boolean;
};

/** Page scaffold: safe area, 20pt gutters, scrolling body, optional header and pinned footer. */
export function Screen({ children, header, footer, onRefresh, refreshing = false }: Props) {
  const colors = useThemeColors();
  return (
    <SafeAreaView className="flex-1 bg-canvas">
      {header}
      <ScrollView
        contentContainerClassName={`flex-grow px-5 pb-6 ${header ? 'pt-2' : 'pt-5'}`}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.muted}
              colors={[colors.ink]}
              progressBackgroundColor={colors.surface}
            />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
      {footer ? <View className="border-t border-line bg-canvas px-5 py-3">{footer}</View> : null}
    </SafeAreaView>
  );
}
