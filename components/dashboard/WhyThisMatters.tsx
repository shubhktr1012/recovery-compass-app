import { View, Text } from 'react-native';
import { AppTypography } from '@/constants/typography';

interface WhyThisMattersProps {
  copy: string;
}

export function WhyThisMatters({ copy }: WhyThisMattersProps) {
  return (
    <View className="border-l-2 border-forest/10 p-0.5 pl-3.5 my-1">
      <Text className="uppercase text-forest/45" style={[AppTypography.eyebrow, { letterSpacing: 1.54 }]}>Why this matters</Text>
      <Text className="text-forest/65 mt-1" style={AppTypography.displayQuote}>
        {`"${copy}"`}
      </Text>
    </View>
  );
}
