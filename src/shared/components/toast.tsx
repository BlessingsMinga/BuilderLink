import { CheckCircle2, CircleAlert, Info } from 'lucide-react-native';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { create } from 'zustand';
import { useThemeColors } from '@/shared/theme';

type Tone = 'success' | 'error' | 'info';
type Toast = { id: number; tone: Tone; message: string };

const useToastStore = create<{ toast: Toast | null; show: (tone: Tone, message: string) => void; hide: () => void }>((set) => ({
  toast: null,
  show: (tone, message) => set({ toast: { id: Date.now(), tone, message } }),
  hide: () => set({ toast: null }),
}));

/**
 * Short confirmation shown at the top of the screen after an action, e.g.
 * "Request accepted". Callable from anywhere, including mutation callbacks.
 */
export const toast = {
  success: (message: string) => useToastStore.getState().show('success', message),
  error: (message: string) => useToastStore.getState().show('error', message),
  info: (message: string) => useToastStore.getState().show('info', message),
};

const DURATION_MS = 3500;

/** Mount once at the root, above the navigator. */
export function ToastHost() {
  const colors = useThemeColors();
  const current = useToastStore((state) => state.toast);
  const hide = useToastStore((state) => state.hide);

  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(hide, current.tone === 'error' ? DURATION_MS + 1500 : DURATION_MS);
    return () => clearTimeout(timer);
  }, [current, hide]);

  if (!current) return null;
  const tone = {
    success: { Icon: CheckCircle2, color: colors.success, bg: 'bg-success-soft' },
    error: { Icon: CircleAlert, color: colors.danger, bg: 'bg-danger-soft' },
    info: { Icon: Info, color: colors.info, bg: 'bg-info-soft' },
  }[current.tone];

  return (
    <SafeAreaView edges={['top']} pointerEvents="box-none" className="absolute left-0 right-0 top-0 px-4 pt-2">
      <Animated.View key={current.id} entering={FadeInUp.duration(200)} exiting={FadeOutUp.duration(200)}>
        <Pressable
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          onPress={hide}
          className={`flex-row items-center gap-3 rounded-2xl border border-line p-4 shadow-sm ${tone.bg}`}
        >
          <tone.Icon size={20} color={tone.color} />
          <View className="flex-1">
            <Text className="font-semibold text-sm text-ink">{current.message}</Text>
          </View>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

/** A user-facing message for a failed request: offline vs. generic. */
export function failureMessage(error: unknown, action: string): string {
  const { code, message } = (error ?? {}) as { code?: string; message?: string };
  if (code === 'unavailable' || /offline|network/i.test(message ?? '')) return 'You’re offline. Reconnect and try again.';
  if (code === 'permission-denied') return `You can’t ${action} right now. Pull to refresh and try again.`;
  return `We couldn’t ${action}. Please try again.`;
}
