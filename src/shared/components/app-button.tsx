import { ActivityIndicator, Pressable, Text } from 'react-native';
import { useThemeColors } from '@/shared/theme';

type Props = { label: string; onPress?: () => void; variant?: 'primary' | 'outline'; loading?: boolean; disabled?: boolean };

/** Full-width button. `primary` is a solid ink fill; `outline` is a hairline border. */
export function AppButton({ label, onPress, variant = 'primary', loading = false, disabled = false }: Props) {
  const colors = useThemeColors();
  const isPrimary = variant === 'primary';
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      className={`h-14 items-center justify-center rounded-xl border px-5 active:opacity-80 ${isPrimary ? 'border-ink bg-ink' : 'border-line bg-surface'} ${isDisabled ? 'opacity-50' : ''}`}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.canvas : colors.ink} />
      ) : (
        <Text className={`text-base font-semibold ${isPrimary ? 'text-canvas' : 'text-ink'}`}>{label}</Text>
      )}
    </Pressable>
  );
}
