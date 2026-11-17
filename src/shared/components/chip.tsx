import { Pressable, Text, View } from 'react-native';

type ChipProps = { label: string; selected?: boolean; onPress?: () => void };

/** A selectable pill. Selected chips are filled with the brand colour. */
export function Chip({ label, selected = false, onPress }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      hitSlop={4}
      onPress={onPress}
      className={`h-11 items-center justify-center rounded-full border px-4 ${selected ? 'border-primary bg-primary' : 'border-line bg-surface'}`}
    >
      <Text className={`text-sm ${selected ? 'font-semibold text-on-primary' : 'font-medium text-ink'}`}>{label}</Text>
    </Pressable>
  );
}

type AvatarProps = {
  name: string;
  size?: 'md' | 'lg';
  /** Set when the avatar sits on the coloured hero band. */
  onHero?: boolean;
};

/** Initials in a tinted circle, standing in for a profile photo. */
export function Avatar({ name, size = 'md', onHero = false }: AvatarProps) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
  return (
    <View
      className={`items-center justify-center rounded-full ${onHero ? 'bg-white/20' : 'bg-brand-soft'} ${size === 'lg' ? 'h-24 w-24' : 'h-14 w-14'}`}
    >
      <Text className={`font-heading ${onHero ? 'text-white' : 'text-brand'} ${size === 'lg' ? 'text-3xl' : 'text-lg'}`}>
        {initials || '?'}
      </Text>
    </View>
  );
}
