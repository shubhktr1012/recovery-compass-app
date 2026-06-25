import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AppColors, AppRadii } from '@/constants/theme';
import { useReducedMotionPreference } from '@/lib/motion/accessibility';
import { MotionDurations } from '@/lib/motion/tokens';

const PILL_SPRING = {
  damping: 34,
  stiffness: 230,
  mass: 0.85,
} as const;

type SegmentLayout = { x: number; width: number };

export type SegmentedPillOption<T extends string> = {
  label: string;
  value: T;
};

type SegmentedPillControlProps<T extends string> = {
  onChange: (value: T) => void;
  options: SegmentedPillOption<T>[];
  style?: ViewStyle;
  value: T;
};

export function SegmentedPillControl<T extends string>({
  onChange,
  options,
  style,
  value,
}: SegmentedPillControlProps<T>) {
  const prefersReducedMotion = useReducedMotionPreference();
  const [segmentLayouts, setSegmentLayouts] = useState<Partial<Record<T, SegmentLayout>>>({});
  const pillX = useSharedValue(0);
  const pillWidth = useSharedValue(0);
  const pillOpacity = useSharedValue(0);
  const hasPositionedPill = useRef(false);

  const movePillToValue = useCallback(
    (nextValue: T, animated: boolean) => {
      const layout = segmentLayouts[nextValue];
      if (!layout) return;

      if (prefersReducedMotion || !animated) {
        pillX.value = layout.x;
        pillWidth.value = layout.width;
        pillOpacity.value = 1;
        return;
      }

      pillX.value = withSpring(layout.x, PILL_SPRING);
      pillWidth.value = withSpring(layout.width, PILL_SPRING);
      pillOpacity.value = withTiming(1, { duration: MotionDurations.fast });
    },
    [pillOpacity, pillWidth, pillX, prefersReducedMotion, segmentLayouts]
  );

  useEffect(() => {
    const hasLayout = Boolean(segmentLayouts[value]);
    movePillToValue(value, hasPositionedPill.current && hasLayout);
    if (hasLayout) {
      hasPositionedPill.current = true;
    }
  }, [movePillToValue, segmentLayouts, value]);

  const pillAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pillOpacity.value,
    transform: [{ translateX: pillX.value }],
    width: pillWidth.value,
  }));

  const handleSegmentLayout = useCallback((segmentValue: T, x: number, width: number) => {
    setSegmentLayouts((current) => {
      const existing = current[segmentValue];
      if (existing?.x === x && existing?.width === width) {
        return current;
      }
      return { ...current, [segmentValue]: { x, width } };
    });
  }, []);

  return (
    <View style={[styles.track, style]}>
      <Animated.View pointerEvents="none" style={[styles.slidingPill, pillAnimatedStyle]} />
      {options.map((option) => {
        const isActive = value === option.value;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            onLayout={(event) => {
              const { x, width } = event.nativeEvent.layout;
              handleSegmentLayout(option.value, x, width);
            }}
            onPress={() => onChange(option.value)}
            style={styles.segment}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const TRACK_INSET = 3;

const styles = StyleSheet.create({
  track: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: AppColors.surface,
    borderRadius: AppRadii.pill,
    padding: TRACK_INSET,
  },
  slidingPill: {
    position: 'absolute',
    top: TRACK_INSET,
    bottom: TRACK_INSET,
    left: 0,
    borderRadius: AppRadii.pill,
    backgroundColor: AppColors.canvas,
    ...Platform.select({
      ios: {
        shadowColor: '#06290C',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: {
        borderWidth: 1,
        borderColor: AppColors.hairline,
      },
      default: {},
    }),
  },
  segment: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    zIndex: 1,
  },
  label: {
    fontFamily: 'Satoshi-SemiBold',
    fontSize: 11,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: 'rgba(6,41,12,0.45)',
  },
  labelActive: {
    color: AppColors.forest,
  },
});
