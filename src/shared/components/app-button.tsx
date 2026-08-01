import { Pressable, Text } from 'react-native';
type Props = { label: string; onPress?: () => void; variant?: 'primary' | 'outline' };
export function AppButton({ label, onPress, variant = 'primary' }: Props) { const base = 'h-14 items-center justify-center rounded-2xl px-5'; return <Pressable accessibilityRole="button" onPress={onPress} className={`${base} ${variant === 'primary' ? 'bg-brand' : 'border border-slate-200 bg-white'}`}><Text className={`text-base font-bold ${variant === 'primary' ? 'text-white' : 'text-ink'}`}>{label}</Text></Pressable>; }
