import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardVisible } from '@/hooks/useKeyboardVisible';
import { getProgramTabBarScrollPadding, getTabBarScrollMetrics } from '@/lib/navigation/tab-bar-layout';

type TabBarMetricsContextValue = {
  measuredBarHeight: number | null;
  setMeasuredBarHeight: (height: number) => void;
};

const TabBarMetricsContext = createContext<TabBarMetricsContextValue | null>(null);

export function TabBarMetricsProvider({ children }: { children: ReactNode }) {
  const [measuredBarHeight, setMeasuredBarHeight] = useState<number | null>(null);
  const value = useMemo<TabBarMetricsContextValue>(
    () => ({
      measuredBarHeight,
      setMeasuredBarHeight: (height: number) => {
        setMeasuredBarHeight((current) => (current === height ? current : height));
      },
    }),
    [measuredBarHeight]
  );

  return <TabBarMetricsContext.Provider value={value}>{children}</TabBarMetricsContext.Provider>;
}

function useTabBarMetricsContext() {
  const context = useContext(TabBarMetricsContext);
  if (!context) {
    throw new Error('useTabBarScrollMetrics must be used within TabBarMetricsProvider');
  }
  return context;
}

export function useTabBarScrollMetrics() {
  const insets = useSafeAreaInsets();
  const { measuredBarHeight } = useTabBarMetricsContext();
  return useMemo(
    () => getTabBarScrollMetrics(insets, measuredBarHeight),
    [insets, measuredBarHeight]
  );
}

export function useTabBarScrollPadding() {
  return useTabBarScrollMetrics().scrollPadding;
}

export function useProgramTabBarScrollPadding() {
  const insets = useSafeAreaInsets();
  const { measuredBarHeight } = useTabBarMetricsContext();
  return useMemo(
    () => getProgramTabBarScrollPadding(insets, measuredBarHeight),
    [insets, measuredBarHeight]
  );
}

export function useKeyboardAwareTabBarScrollPadding() {
  const insets = useSafeAreaInsets();
  const tabBarScrollPadding = useTabBarScrollPadding();
  const keyboardVisible = useKeyboardVisible();

  return useMemo(() => {
    if (!keyboardVisible) {
      return tabBarScrollPadding;
    }

    // Tab bar + fade hide while typing; keep only safe-area breathing room.
    return Math.max(insets.bottom, 24);
  }, [insets.bottom, keyboardVisible, tabBarScrollPadding]);
}

export function useReportTabBarHeight() {
  return useTabBarMetricsContext().setMeasuredBarHeight;
}
