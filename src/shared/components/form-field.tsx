import type { TextInputProps } from 'react-native';
import { Text, TextInput, View } from 'react-native';
import { useThemeColors } from '@/shared/theme';

type Props = TextInputProps & { label: string; error?: string | null };

/** Labelled text input with an inline error message underneath. */
export function FormField({ label, error, multiline, ...inputProps }: Props) {
  const colors = useThemeColors();
  return (
    <View>
      <Text className="mb-2 font-medium text-sm text-ink">{label}</Text>
      <TextInput
        className={`rounded-xl border bg-surface px-4 font-body text-base text-ink ${multiline ? 'h-28 py-3' : 'h-14'} ${error ? 'border-danger' : 'border-line'}`}
        placeholderTextColor={colors.faint}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        {...inputProps}
      />
      {error ? (
        <Text accessibilityLiveRegion="polite" className="mt-1.5 font-body text-sm text-danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
