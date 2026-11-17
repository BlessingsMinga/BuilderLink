import { ActivityIndicator, Pressable, Text } from 'react-native';
import { useThemeColors } from '@/shared/theme';

type Props = { label: string; onPress?: () => void; variant?: 'primary' | 'outline'; loading?: boolean; disabled?: boolean };

/** Full-width button. `primary` is filled with the brand colour; `outline` is a bordered surface. */
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
      className={`h-14 items-center justify-center rounded-2xl border px-5 active:opacity-80 ${isPrimary ? 'border-primary bg-primary' : 'border-line bg-surface'} ${isDisabled ? 'opacity-50' : ''}`}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.onPrimary : colors.brand} />
      ) : (
        <Text className={`font-bold text-base ${isPrimary ? 'text-on-primary' : 'text-ink'}`}>{label}</Text>
      )}
    </Pressable>
  );
}
