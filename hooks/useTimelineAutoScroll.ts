import { useCallback, useEffect, useRef } from 'react';
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

const TIMELINE_TOP_INSET = 20;

export function useTimelineAutoScroll(activeDayNumber: number | null, resetKey?: string | number) {
  const scrollRef = useRef<ScrollView>(null);
  const daysContainerY = useRef(0);
  const timelineListY = useRef(0);
  const currentDayRelativeY = useRef<number | null>(null);
  const currentDayHeight = useRef<number | null>(null);
  const hasFiredHaptic = useRef(false);
  const hasAutoScrolledRef = useRef(false);

  const getCurrentDayScrollY = useCallback(() => {
    if (currentDayRelativeY.current === null) {
      return null;
    }

    return Math.max(
      0,
      daysContainerY.current +
        timelineListY.current +
        currentDayRelativeY.current -
        TIMELINE_TOP_INSET
    );
  }, []);

  const scrollToCurrentDay = useCallback(
    (animated = false) => {
      const targetY = getCurrentDayScrollY();
      if (targetY === null || activeDayNumber == null) {
        return false;
      }

      scrollRef.current?.scrollTo({ animated, y: targetY });
      return true;
    },
    [activeDayNumber, getCurrentDayScrollY]
  );

  const tryAutoScrollToCurrentDay = useCallback(() => {
    if (hasAutoScrolledRef.current || activeDayNumber == null) {
      return;
    }

    const didScroll = scrollToCurrentDay(false);
    if (didScroll) {
      hasAutoScrolledRef.current = true;
    }
  }, [activeDayNumber, scrollToCurrentDay]);

  useEffect(() => {
    hasAutoScrolledRef.current = false;
    currentDayRelativeY.current = null;
    currentDayHeight.current = null;
  }, [activeDayNumber, resetKey]);

  useFocusEffect(
    useCallback(() => {
      hasAutoScrolledRef.current = false;
      requestAnimationFrame(() => {
        tryAutoScrollToCurrentDay();
      });
    }, [tryAutoScrollToCurrentDay])
  );

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (currentDayRelativeY.current === null || currentDayHeight.current === null) {
      return;
    }

    const { contentOffset, layoutMeasurement } = event.nativeEvent;
    const scrollCenterY = contentOffset.y + layoutMeasurement.height / 2;
    const absoluteTop =
      daysContainerY.current + timelineListY.current + currentDayRelativeY.current;
    const snapTop = absoluteTop + currentDayHeight.current * 0.25;
    const snapBottom = absoluteTop + currentDayHeight.current * 0.75;

    if (scrollCenterY >= snapTop && scrollCenterY <= snapBottom) {
      if (!hasFiredHaptic.current) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        hasFiredHaptic.current = true;
      }
    } else {
      hasFiredHaptic.current = false;
    }
  }, []);

  const handleDaysContainerLayout = useCallback((event: LayoutChangeEvent) => {
    daysContainerY.current = event.nativeEvent.layout.y;
  }, []);

  const handleTimelineListLayout = useCallback((event: LayoutChangeEvent) => {
    timelineListY.current = event.nativeEvent.layout.y;
  }, []);

  const handleCurrentDayLayout = useCallback(
    (event: LayoutChangeEvent) => {
      currentDayRelativeY.current = event.nativeEvent.layout.y;
      currentDayHeight.current = event.nativeEvent.layout.height;
      requestAnimationFrame(() => {
        tryAutoScrollToCurrentDay();
      });
    },
    [tryAutoScrollToCurrentDay]
  );

  return {
    handleCurrentDayLayout,
    handleDaysContainerLayout,
    handleScroll,
    handleTimelineListLayout,
    scrollRef,
  };
}
