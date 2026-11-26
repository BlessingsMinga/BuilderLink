import LottieView from 'lottie-react-native';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * The animation is generated from `assets/images/logo.png` by
 * `scripts/generate-loader-animation.py`. Frames 0-132 assemble the logo
 * once; frames 132-252 are a gentle breathing cycle that loops without ever
 * taking the logo apart again.
 */
const animation = require('../../../assets/animations/builderlink-loader.json');
const INTRO_END = 132;
const LOOP_END = 252;
/** Height / width of the animation canvas, so sizing never distorts the logo. */
const ASPECT = 311 / 329;

export interface BuilderLinkLoaderProps {
  /** Width of the logo in points; height follows the logo's aspect ratio. */
  size?: number;
  /** Play the assembly animation on mount. When false the assembled logo is shown still. */
  autoPlay?: boolean;
  /** Keep breathing after the logo is assembled. When false it stops on the assembled logo. */
  loop?: boolean;
  backgroundColor?: string;
  showLabel?: boolean;
  /** Shown under the logo when `showLabel` is set; always used as the accessibility label. */
  label?: string;
}

/** Animated BuilderLink logo for loading states. */
export function BuilderLinkLoader({
  size = 120,
  autoPlay = true,
  loop = true,
  backgroundColor = 'transparent',
  showLabel = false,
  label = 'Connecting...',
}: BuilderLinkLoaderProps) {
  const ref = useRef<LottieView>(null);
  const [breathing, setBreathing] = useState(false);

  useEffect(() => {
    if (autoPlay) ref.current?.play(0, INTRO_END);
  }, [autoPlay]);

  useEffect(() => {
    if (breathing) ref.current?.play(INTRO_END, LOOP_END);
  }, [breathing]);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      className="items-center justify-center gap-3"
      style={{ backgroundColor }}
    >
      <LottieView
        ref={ref}
        source={animation}
        autoPlay={false}
        loop={breathing}
        // Not playing: hold on the assembled logo instead of the empty first frame.
        progress={autoPlay ? undefined : INTRO_END / LOOP_END}
        onAnimationFinish={(cancelled) => {
          if (!cancelled && loop && !breathing) setBreathing(true);
        }}
        resizeMode="contain"
        style={{ width: size, height: size * ASPECT }}
      />
      {showLabel ? <Text className="text-center font-medium text-sm text-muted">{label}</Text> : null}
    </View>
  );
}

export interface BuilderLinkFullScreenLoaderProps extends Pick<BuilderLinkLoaderProps, 'label' | 'size'> {
  /** Screen background; white by default. */
  backgroundColor?: string;
}

/** Blocks the whole screen with the centred, animated logo. Label is shown only when given. */
export function BuilderLinkFullScreenLoader({ label, size = 140, backgroundColor = '#FFFFFF' }: BuilderLinkFullScreenLoaderProps) {
  return (
    <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor }}>
      <BuilderLinkLoader size={size} showLabel={!!label} label={label ?? 'Loading BuilderLink'} />
    </SafeAreaView>
  );
}
