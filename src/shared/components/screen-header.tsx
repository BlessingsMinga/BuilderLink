import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useThemeColors } from '@/shared/theme';

type Props = {
  title?: string;
  /** Optional action on the right, e.g. a `<HeaderButton />`. */
  right?: ReactNode;
};

/** The one header used by every pushed screen: back button, title, optional action. */
export function ScreenHeader({ title, right }: Props) {
  const colors = useThemeColors();
  return (
    <View className="h-14 flex-row items-center px-2">
      <HeaderButton label="Go back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
        <ChevronLeft color={colors.ink} size={24} />
      </HeaderButton>
      <Text numberOfLines={1} className="flex-1 px-1 font-heading-semibold text-lg text-ink">
        {title}
      </Text>
      {right}
    </View>
  );
}

/** A 48pt icon button for the header. */
export function HeaderButton({ label, onPress, children }: { label: string; onPress: () => void; children: ReactNode }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="h-12 w-12 items-center justify-center rounded-full active:bg-subtle"
    >
      {children}
    </Pressable>
  );
}
