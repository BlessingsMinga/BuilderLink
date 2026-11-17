import type { TextInputProps } from 'react-native';
import { Text, TextInput, View } from 'react-native';
import { useThemeColors } from '@/shared/theme';
type Props = TextInputProps & { label: string; error?: string };
export function FormField({ label, error, ...inputProps }: Props) { const colors = useThemeColors(); return <View><Text className="mb-2 text-sm font-semibold text-ink">{label}</Text><TextInput className={`h-14 rounded-xl border bg-surface px-4 text-base text-ink ${error ? 'border-danger' : 'border-line'}`} placeholderTextColor={colors.faint} {...inputProps} />{error ? <Text accessibilityLiveRegion="polite" className="mt-1.5 text-sm text-danger">{error}</Text> : null}</View>; }
