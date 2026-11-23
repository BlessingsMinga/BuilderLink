import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useThemeColors } from '@/shared/theme';

type Props = {
  title?: string;
  /** Optional action on the right, e.g. a `<HeaderButton />`. */
  right?: ReactNode;
  /** Set when the header sits on the coloured hero band, so it uses white. */
  onHero?: boolean;
};

/** The one header used by every pushed screen: back button, title, optional action. */
export function ScreenHeader({ title, right, onHero = false }: Props) {
  const colors = useThemeColors();
  return (
    <View className="h-16 flex-row items-center gap-3.5 px-5">
      <HeaderButton label="Go back" onHero={onHero} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
        <ChevronLeft color={onHero ? '#FFFFFF' : colors.ink} size={22} />
      </HeaderButton>
      <Text numberOfLines={1} className={`flex-1 font-semibold text-base ${onHero ? 'text-white' : 'text-ink'}`}>
        {title}
      </Text>
      {right}
    </View>
  );
}

type HeaderButtonProps = { label: string; onPress: () => void; children: ReactNode; onHero?: boolean };

/** A 44pt round, bordered icon button for the header. */
export function HeaderButton({ label, onPress, children, onHero = false }: HeaderButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      className={`h-11 w-11 items-center justify-center rounded-full border ${onHero ? 'border-white/30 active:bg-white/20' : 'border-line bg-subtle active:bg-line'}`}
    >
      {children}
    </Pressable>
  );
}
