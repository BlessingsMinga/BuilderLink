import { Clock3 } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { Screen } from './screen';
import { useThemeColors } from '@/shared/theme';
export function PlaceholderScreen({ title, description }: { title: string; description: string }) { const colors = useThemeColors(); return <Screen><View className="flex-1 items-center justify-center gap-4"><View className="h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft"><Clock3 color={colors.brand} size={30} /></View><Text className="text-center text-2xl font-bold text-ink">{title}</Text><Text className="max-w-xs text-center text-base leading-6 text-muted">{description}</Text></View></Screen>; }
