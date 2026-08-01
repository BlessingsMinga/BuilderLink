import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import type { ReactNode } from 'react';
export function Screen({ children }: { children: ReactNode }) { return <SafeAreaView className="flex-1 bg-canvas"><ScrollView contentContainerClassName="flex-grow px-6 py-5" showsVerticalScrollIndicator={false}>{children}</ScrollView></SafeAreaView>; }
