import { CircleAlert, WifiOff } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useThemeColors } from '@/shared/theme';

/** True when a failed request looks like a lost connection rather than a real fault. */
export function isOfflineError(error: unknown): boolean {
  const { code, message } = (error ?? {}) as { code?: string; message?: string };
  return code === 'unavailable' || code === 'auth/network-request-failed' || /offline|network/i.test(message ?? '');
}

type ErrorStateProps = {
  /** The error from the failed request; decides between the offline and generic message. */
  error?: unknown;
  /** What couldn't be loaded, e.g. "your bookings". */
  what: string;
  onRetry?: () => void;
};

/** Shown in place of content that failed to load. */
export function ErrorState({ error, what, onRetry }: ErrorStateProps) {
  const colors = useThemeColors();
  const offline = isOfflineError(error);
  return (
    <View className="items-center gap-3 rounded-[22px] border border-line bg-surface p-6">
      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-canvas">
        {offline ? <WifiOff color={colors.muted} size={26} /> : <CircleAlert color={colors.muted} size={26} />}
      </View>
      <Text className="text-center font-semibold text-base text-ink">
        {offline ? 'You’re offline' : `We couldn’t load ${what}`}
      </Text>
      <Text className="text-center font-body text-sm text-muted">
        {offline ? `Reconnect to load ${what}.` : 'Something went wrong on our side. Please try again.'}
      </Text>
      {onRetry ? (
        <Pressable onPress={onRetry} className="mt-1 h-12 items-center justify-center rounded-[14px] border border-line px-6 active:bg-subtle">
          <Text className="font-semibold text-base text-ink">Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

type EmptyStateProps = {
  /** Shown in a tinted circle above the message. */
  icon?: ReactNode;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

/** Shown when a list has nothing in it yet. */
export function EmptyState({ icon, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="items-center gap-3 rounded-[22px] border border-line bg-surface p-6">
      {icon ? <View className="h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft">{icon}</View> : null}
      <Text className="text-center font-body text-base text-muted">{message}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} className="mt-1 h-12 items-center justify-center rounded-[14px] bg-primary px-6 active:opacity-80">
          <Text className="font-semibold text-base text-on-primary">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Inline validation or failure message shown under a field or above a button. */
export function ErrorText({ children }: { children?: string | null }) {
  if (!children) return null;
  return (
    <Text accessibilityLiveRegion="polite" className="mt-2 font-medium text-sm text-danger">
      {children}
    </Text>
  );
}
