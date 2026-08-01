import type { TextInputProps } from 'react-native';
import { Text, TextInput, View } from 'react-native';
type Props = TextInputProps & { label: string; error?: string };
export function FormField({ label, error, ...inputProps }: Props) { return <View><Text className="mb-2 text-sm font-semibold text-ink">{label}</Text><TextInput className={`h-14 rounded-2xl border bg-white px-4 text-base text-ink ${error ? 'border-red-400' : 'border-slate-200'}`} placeholderTextColor="#94A3B8" {...inputProps} />{error ? <Text accessibilityLiveRegion="polite" className="mt-1.5 text-sm text-red-500">{error}</Text> : null}</View>; }
