import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

interface MyProgramsProps {
  programName: string;
  programDescription: string;
  currentDayNumber: number;
  totalDays: number;
  percentageComplete: number;
}

export function MyPrograms({
  programName,
  programDescription,
  currentDayNumber,
  totalDays,
  percentageComplete,
}: MyProgramsProps) {
  const router = useRouter();

  return (
    <View className="mt-1">
      <View className="flex-row justify-between items-baseline px-0.5 mb-3">
        <Text className="font-erode-medium text-[20px] text-forest tracking-[-0.01em]">My Programs</Text>
        <Pressable onPress={() => router.push('/account/programs')}>
          <Text className="font-satoshi-medium text-[11px] text-forest/45 tracking-[0.04em]">View all</Text>
        </Pressable>
      </View>
      <Pressable onPress={() => router.push('/(tabs)/program')} className="bg-forest rounded-[20px] p-[18px]">
        <Text className="font-satoshi-bold uppercase text-[9px] tracking-[0.18em] text-sage/50">Active · {programName}</Text>
        <Text className="font-erode-medium text-[18px] text-white leading-snug mt-[5px]">{programName}</Text>
        <Text className="font-satoshi text-[11px] text-white/50 mt-[3px] leading-relaxed">{programDescription}</Text>
        <View className="h-[2px] bg-sage/20 rounded-full mt-3.5 overflow-hidden">
          <View className="h-[2px] bg-sage rounded-full" style={{ width: `${percentageComplete}%` }} />
        </View>
        <View className="flex-row justify-between mt-[5px]">
          <Text className="font-satoshi text-[10px] text-sage/50">Day {currentDayNumber} of {totalDays}</Text>
          <Text className="font-satoshi text-[10px] text-sage/50">{percentageComplete}%</Text>
        </View>
      </Pressable>
    </View>
  );
}
