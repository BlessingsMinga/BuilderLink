import { Clock3 } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { Screen } from './screen';
export function PlaceholderScreen({ title, description }: { title: string; description: string }) { return <Screen><View className="flex-1 items-center justify-center gap-4"><View className="h-16 w-16 items-center justify-center rounded-3xl bg-orange-100"><Clock3 color="#F97316" size={30} /></View><Text className="text-center text-2xl font-bold text-ink">{title}</Text><Text className="max-w-xs text-center text-base leading-6 text-slate-500">{description}</Text></View></Screen>; }
