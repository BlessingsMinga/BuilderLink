import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

/** A pulsing grey block shown where content is still loading. Size it with `className`. */
export function Skeleton({ className = '' }: { className?: string }) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View style={{ opacity }}>
      <View className={`rounded-md bg-subtle ${className}`} />
    </Animated.View>
  );
}

/** Placeholder with the outline of a list card. */
export function CardSkeleton() {
  return (
    <View className="flex-row gap-4 rounded-3xl border border-line bg-surface p-4">
      <Skeleton className="h-16 w-16 rounded-[18px]" />
      <View className="flex-1 gap-2.5 pt-1">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </View>
    </View>
  );
}

/** A stack of card placeholders for loading lists. */
export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View accessibilityLabel="Loading" className="gap-3">
      {Array.from({ length: count }, (_, index) => (
        <CardSkeleton key={index} />
      ))}
    </View>
  );
}
