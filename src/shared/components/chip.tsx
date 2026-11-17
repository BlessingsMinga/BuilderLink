import { Pressable, Text, View } from 'react-native';

type ChipProps = { label: string; selected?: boolean; onPress?: () => void };

/** A selectable pill. Selected chips are filled with ink. */
export function Chip({ label, selected = false, onPress }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      hitSlop={4}
      onPress={onPress}
      className={`h-10 items-center justify-center rounded-full border px-4 ${selected ? 'border-ink bg-ink' : 'border-line bg-surface'}`}
    >
      <Text className={`font-medium text-sm ${selected ? 'text-canvas' : 'text-ink'}`}>{label}</Text>
    </Pressable>
  );
}

/** Initials in a circle, standing in for a profile photo. */
export function Avatar({ name, size = 'md' }: { name: string; size?: 'md' | 'lg' }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
  return (
    <View className={`items-center justify-center rounded-full bg-subtle ${size === 'lg' ? 'h-24 w-24' : 'h-12 w-12'}`}>
      <Text className={`font-heading text-muted ${size === 'lg' ? 'text-3xl' : 'text-base'}`}>{initials || '?'}</Text>
    </View>
  );
}
