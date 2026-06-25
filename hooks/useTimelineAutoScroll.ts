import { useCallback, useEffect, useRef } from 'react';
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native';
import { InteractionManager } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

const TIMELINE_TOP_INSET = 20;
const ESTIMATED_ROW_HEIGHT = 132;
const SCROLL_RETRY_DELAYS_MS = [0, 50, 150, 300, 500];

export function useTimelineAutoScroll(
  anchorDayNumber: number | null,
  resetKey?: string | number,
  anchorDayIndex = -1
) {
  const scrollRef = useRef<ScrollView>(null);
  const daysContainerY = useRef(0);
  const timelineListY = useRef(0);
  const currentDayRelativeY = useRef<number | null>(null);
  const currentDayHeight = useRef<number | null>(null);
  const hasFiredHaptic = useRef(false);
  const anchorDayNumberRef = useRef(anchorDayNumber);
  const anchorDayIndexRef = useRef(anchorDayIndex);
  const pendingScrollTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  anchorDayNumberRef.current = anchorDayNumber;
  anchorDayIndexRef.current = anchorDayIndex;

  const clearPendingScrollTimers = useCallback(() => {
    pendingScrollTimers.current.forEach(clearTimeout);
    pendingScrollTimers.current = [];
  }, []);

  const getScrollY = useCallback(() => {
    if (anchorDayNumberRef.current == null) {
      return null;
    }

    const baseOffset = daysContainerY.current + timelineListY.current - TIMELINE_TOP_INSET;

    if (currentDayRelativeY.current !== null) {
      return Math.max(0, baseOffset + currentDayRelativeY.current);
    }

    if (anchorDayIndexRef.current >= 0) {
      return Math.max(0, baseOffset + anchorDayIndexRef.current * ESTIMATED_ROW_HEIGHT);
    }

    return null;
  }, []);

  const scrollToAnchor = useCallback(
    (animated = false) => {
      const targetY = getScrollY();
      if (targetY === null || anchorDayNumberRef.current == null || !scrollRef.current) {
        return false;
      }

      scrollRef.current.scrollTo({ animated, y: targetY });
      return true;
    },
    [getScrollY]
  );

  const scheduleScrollAttempts = useCallback(() => {
    clearPendingScrollTimers();

    if (anchorDayNumberRef.current == null) {
      return;
    }

    const attemptScroll = () => {
      scrollToAnchor(false);
    };

    attemptScroll();
    requestAnimationFrame(attemptScroll);
    requestAnimationFrame(() => requestAnimationFrame(attemptScroll));

    for (const delay of SCROLL_RETRY_DELAYS_MS) {
      pendingScrollTimers.current.push(setTimeout(attemptScroll, delay));
    }
  }, [clearPendingScrollTimers, scrollToAnchor]);

  useEffect(() => {
    currentDayRelativeY.current = null;
    currentDayHeight.current = null;
    scheduleScrollAttempts();

    return () => {
      clearPendingScrollTimers();
    };
  }, [anchorDayNumber, anchorDayIndex, resetKey, clearPendingScrollTimers, scheduleScrollAttempts]);

  useFocusEffect(
    useCallback(() => {
      const interactionTask = InteractionManager.runAfterInteractions(() => {
        scheduleScrollAttempts();
      });

      return () => {
        interactionTask.cancel();
        clearPendingScrollTimers();
      };
    }, [clearPendingScrollTimers, scheduleScrollAttempts])
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

  const handleDaysContainerLayout = useCallback(
    (event: LayoutChangeEvent) => {
      daysContainerY.current = event.nativeEvent.layout.y;
      scheduleScrollAttempts();
    },
    [scheduleScrollAttempts]
  );

  const handleTimelineListLayout = useCallback(
    (event: LayoutChangeEvent) => {
      timelineListY.current = event.nativeEvent.layout.y;
      scheduleScrollAttempts();
    },
    [scheduleScrollAttempts]
  );

  const handleCurrentDayLayout = useCallback(
    (event: LayoutChangeEvent) => {
      currentDayRelativeY.current = event.nativeEvent.layout.y;
      currentDayHeight.current = event.nativeEvent.layout.height;
      scrollToAnchor(false);
    },
    [scrollToAnchor]
  );

  const handleScrollViewLayout = useCallback(() => {
    scheduleScrollAttempts();
  }, [scheduleScrollAttempts]);

  const handleContentSizeChange = useCallback(() => {
    scheduleScrollAttempts();
  }, [scheduleScrollAttempts]);

  return {
    handleContentSizeChange,
    handleCurrentDayLayout,
    handleDaysContainerLayout,
    handleScroll,
    handleScrollViewLayout,
    handleTimelineListLayout,
    scrollRef,
  };
}
