import { Hammer } from 'lucide-react-native';
import { View } from 'react-native';
import { useThemeColors } from '@/shared/theme';

/** The BuilderLink logo tile. Pass `onHero` when it sits on the coloured hero band. */
export function BrandMark({ onHero = false }: { onHero?: boolean }) {
  const colors = useThemeColors();
  return (
    <View className={`h-14 w-14 items-center justify-center rounded-2xl ${onHero ? 'bg-white' : 'bg-primary'}`}>
      <Hammer size={28} color={onHero ? colors.hero : colors.onPrimary} strokeWidth={2.25} />
    </View>
  );
}
