import { useState } from 'react';
import type { TextInputProps } from 'react-native';
import { Text, TextInput, View } from 'react-native';
import { useThemeColors } from '@/shared/theme';

type Props = TextInputProps & {
  label: string;
  error?: string | null;
  /** Fixed text in its own box before the input, e.g. a country code. */
  prefix?: string;
};

/** Labelled text input with an inline error message underneath. The border turns brand-coloured while focused. */
export function FormField({ label, error, multiline, prefix, onFocus, onBlur, ...inputProps }: Props) {
  const colors = useThemeColors();
  const [focused, setFocused] = useState(false);
  // A 2px focus ring; padding drops by 1px so the text doesn't shift.
  const border = error ? 'border border-danger px-4' : focused ? 'border-2 border-primary px-[15px]' : 'border border-line px-4';
  return (
    <View>
      <Text className="mb-2 font-semibold text-sm text-ink">{label}</Text>
      <View className="flex-row gap-2">
        {prefix ? (
          <View className="h-14 justify-center rounded-2xl border border-line bg-surface px-3.5">
            <Text className="font-semibold text-base text-ink">{prefix}</Text>
          </View>
        ) : null}
        <TextInput
          className={`min-w-0 flex-1 rounded-2xl bg-surface font-body text-base text-ink ${multiline ? 'h-28 py-3' : 'h-14'} ${border}`}
          placeholderTextColor={colors.faint}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          accessibilityLabel={prefix ? `${label}, after ${prefix}` : label}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...inputProps}
        />
      </View>
      {error ? (
        <Text accessibilityLiveRegion="polite" className="mt-1.5 font-body text-sm text-danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
