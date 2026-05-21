import React from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import { ScreenEntrance } from '@/components/motion/ScreenEntrance';
import {
  MotionDistance,
  MotionDurations,
} from '@/lib/motion/tokens';

interface StaggeredItemProps {
  children: React.ReactNode;
  className?: string;
  distance?: number;
  index: number;
  maxDelay?: number;
  stagger?: number;
  style?: StyleProp<ViewStyle>;
}

export function StaggeredItem({
  children,
  className,
  distance = MotionDistance.cardY,
  index,
  maxDelay = 240,
  stagger = MotionDurations.stagger,
  style,
}: StaggeredItemProps) {
  return (
    <ScreenEntrance
      className={className}
      delay={Math.min(index * stagger, maxDelay)}
      distance={distance}
      style={style}
    >
      {children}
    </ScreenEntrance>
  );
}
