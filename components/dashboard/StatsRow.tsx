import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { Svg, Path, Circle } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Skeleton } from '@/components/ui/Skeleton';
import type { DashboardStatItem } from '@/lib/dashboard-statistics';

interface StatsRowProps {
  items: DashboardStatItem[];
}

/** Maps stat IDs to SVG path children (rendered inside a parent <Svg>). */
function StatIconPaths({ id }: { id: string }) {
  switch (id) {
    case 'steps-today':
      return <Path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />;
    case 'current-streak':
      return <Path d="M12 3C8 8 6 11 6 15a6 6 0 0012 0c0-4-2-7-6-12z" />;
    case 'days-completed':
      return (
        <>
          <Path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
          <Path d="M22 4L12 14.01l-3-3" />
        </>
      );
    case 'journey-length':
      return (
        <>
          <Circle cx="12" cy="12" r="10" />
          <Path d="M12 6v6l4 2" />
        </>
      );
    default:
      return <Path d="M22 12h-4l-3 9L9 3l-3 9H2" />;
  }
}

/** A subtle pulsing dot that indicates live / active status. */
function PulsingDot() {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.5, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: 2 - scale.value, // fades out as it expands
  }));

  return (
    <View style={{ width: 6, height: 6 }}>
      {/* Static inner dot */}
      <View
        className="absolute rounded-full bg-success"
        style={{ width: 6, height: 6 }}
      />
      {/* Animated halo */}
      <Animated.View
        className="absolute rounded-full bg-success/40"
        style={[{ width: 6, height: 6 }, animatedStyle]}
      />
    </View>
  );
}

export function StatsRow({ items }: StatsRowProps) {
  return (
    <View className="flex-row justify-between gap-2.5">
      {items.map((item, index) => {
        const isFirst = index === 0;

        return (
          <View
            key={item.id}
            className="flex-1 rounded-[20px] overflow-hidden"
            style={{
              backgroundColor: isFirst ? '#06290C' : '#FFFFFF',
              shadowColor: isFirst ? '#06290C' : '#06290C',
              shadowOffset: { width: 0, height: isFirst ? 6 : 2 },
              shadowOpacity: isFirst ? 0.22 : 0.06,
              shadowRadius: isFirst ? 14 : 8,
              elevation: isFirst ? 8 : 3,
            }}
          >
            <View className="p-3.5 pt-3 flex-col">
              {/* Top row: icon + status indicator */}
              <View className="flex-row items-center justify-between mb-2.5">
                <View
                  className="rounded-full items-center justify-center"
                  style={{
                    width: 28,
                    height: 28,
                    backgroundColor: isFirst
                      ? 'rgba(227,243,229,0.15)'
                      : '#EEF6EF',
                  }}
                >
                  <Svg
                    width={13}
                    height={13}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={isFirst ? '#E3F3E5' : '#06290C'}
                    strokeWidth={1.7}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <StatIconPaths id={item.id} />
                  </Svg>
                </View>
                {item.state === 'ready' && <PulsingDot />}
              </View>

              {/* Value */}
              {item.state === 'pending' ? (
                <Skeleton
                  width="72%"
                  height={28}
                  borderRadius={8}
                  className={isFirst ? 'bg-sage/15' : 'bg-forest/8'}
                />
              ) : (
                <Text
                  className={`font-erode-semibold text-[22px] tracking-[-0.03em] leading-none ${
                    isFirst ? 'text-white' : 'text-forest'
                  }`}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {item.value}
                </Text>
              )}

              {/* Label */}
              <Text
                className={`font-satoshi-bold uppercase text-[10px] tracking-[0.12em] mt-1.5 ${
                  isFirst ? 'text-sage/55' : 'text-forest/38'
                }`}
                numberOfLines={1}
              >
                {item.label}
              </Text>

              {/* Sublabel */}
              {item.state === 'pending' ? (
                <Skeleton
                  width="85%"
                  height={10}
                  borderRadius={5}
                  className={`mt-1.5 ${isFirst ? 'bg-sage/12' : 'bg-forest/6'}`}
                />
              ) : (
                <Text
                  className={`font-satoshi text-[11px] leading-snug mt-1 ${
                    isFirst ? 'text-sage/45' : 'text-forest/35'
                  }`}
                  numberOfLines={1}
                >
                  {item.sublabel ?? '\u00A0'}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}
