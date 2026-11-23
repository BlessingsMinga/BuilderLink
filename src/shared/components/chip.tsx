import { Image, Pressable, Text, View } from 'react-native';

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
  size?: 'sm' | 'md' | 'lg';
  /** `tile` is a rounded square, used for builders (as in the profile design); `circle` for people. */
  shape?: 'circle' | 'tile';
  /** Set when the avatar sits on the coloured hero band. */
  onHero?: boolean;
  /** Profile photo; initials are shown when absent. */
  photoUrl?: string | null;
};

const AVATAR_SIZE = { sm: 'h-11 w-11', md: 'h-16 w-16', lg: 'h-24 w-24' } as const;

/** Initials in a tinted circle, standing in for a profile photo. */
export function Avatar({ name, size = 'md', shape = 'circle', onHero = false, photoUrl }: AvatarProps) {
  const rounded = shape === 'tile' ? (size === 'lg' ? 'rounded-3xl' : 'rounded-[18px]') : 'rounded-full';
  if (photoUrl) {
    const px = size === 'lg' ? 300 : 200;
    const uri = photoUrl.replace('/image/upload/', `/image/upload/c_fill,g_face,w_${px},h_${px},q_auto,f_auto/`);
    return (
      <View className={`overflow-hidden bg-subtle ${rounded} ${AVATAR_SIZE[size]}`}>
        <Image source={{ uri }} accessibilityLabel={`Photo of ${name}`} className="h-full w-full" />
      </View>
    );
  }
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
  return (
    <View
      className={`items-center justify-center ${rounded} ${onHero ? 'bg-white/20' : 'bg-brand-soft'} ${AVATAR_SIZE[size]}`}
    >
      <Text className={`font-heading ${onHero ? 'text-white' : 'text-brand'} ${size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-base' : 'text-xl'}`}>
        {initials || '?'}
      </Text>
    </View>
  );
}
