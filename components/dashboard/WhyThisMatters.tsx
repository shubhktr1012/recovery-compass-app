import { View, Text } from 'react-native';

interface WhyThisMattersProps {
  copy: string;
}

export function WhyThisMatters({ copy }: WhyThisMattersProps) {
  return (
    <View className="border-l-2 border-forest/10 p-0.5 pl-3.5 my-1">
      <Text className="font-satoshi-bold uppercase text-[9px] tracking-[0.18em] text-forest/45">Why this matters</Text>
      <Text className="font-erode-medium-italic text-[15px] text-forest/65 leading-relaxed mt-1">
        {`"${copy}"`}
      </Text>
    </View>
  );
}
