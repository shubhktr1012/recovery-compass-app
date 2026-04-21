import { View, Text } from 'react-native';

import { Skeleton } from '@/components/ui/Skeleton';
import type { DashboardStatItem } from '@/lib/dashboard-statistics';

interface StatsRowProps {
  items: DashboardStatItem[];
}

export function StatsRow({ items }: StatsRowProps) {
  return (
    <View className="flex-row justify-between gap-2.5">
      {items.map((item) => (
        <View
          key={item.id}
          className="flex-1 bg-white rounded-[18px] p-3 py-3.5 text-center shadow-sm shadow-forest/5 flex-col items-center"
        >
          {item.state === 'pending' ? (
            <Skeleton width="72%" height={30} borderRadius={10} className="bg-forest/10 mb-1" />
          ) : (
            <Text className="font-erode-medium text-2xl text-forest tracking-[-0.02em] leading-none mb-1 text-center">
              {item.value}
            </Text>
          )}
          <Text className="font-satoshi-bold uppercase text-[9px] tracking-[0.16em] text-forest/40 text-center">
            {item.label}
          </Text>
          {item.state === 'pending' ? (
            <Skeleton width="82%" height={12} borderRadius={6} className="bg-forest/10 mt-1" />
          ) : (
            <Text className="font-satoshi text-[10px] text-forest/40 mt-0.5 text-center">
              {item.sublabel ?? '\u00A0'}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}
