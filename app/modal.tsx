import { Href, Link, useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';

export default function ModalScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView contentContainerClassName="px-6 py-8 pb-12">
        <Text className="font-satoshi-bold text-danger text-xs uppercase mb-3">SOS</Text>
        <Text className="font-erode-bold text-4xl text-forest mb-3">Pause the spiral</Text>
        <Text className="font-satoshi text-gray-600 text-base leading-7 mb-8">
          This is a short recovery interrupt. You do not need to solve the whole day right now. Just get through the next few minutes safely and consciously.
        </Text>

        <View className="rounded-3xl bg-white border border-gray-200 p-5 mb-4">
          <Text className="font-erode-semibold text-2xl text-forest mb-2">1. Delay for 10 minutes</Text>
          <Text className="font-satoshi text-gray-700 leading-7">
            Say: “I&apos;m not deciding now.” Give yourself ten minutes before any action.
          </Text>
        </View>

        <View className="rounded-3xl bg-white border border-gray-200 p-5 mb-4">
          <Text className="font-erode-semibold text-2xl text-forest mb-2">2. Ground your body</Text>
          <Text className="font-satoshi text-gray-700 leading-7">
            Name five things you can see, three things you can hear, and press your feet into the floor.
          </Text>
        </View>

        <View className="rounded-3xl bg-white border border-gray-200 p-5 mb-6">
          <Text className="font-erode-semibold text-2xl text-forest mb-2">3. Move, then journal</Text>
          <Text className="font-satoshi text-gray-700 leading-7">
            Walk slowly, wash your face, or stretch your shoulders. Then capture what triggered this moment.
          </Text>
        </View>

        <Button
          label="Open Journal"
          onPress={() => router.push('/(tabs)/journal' as Href)}
          size="lg"
        />
        <Button
          label="Back to Home"
          variant="ghost"
          className="mt-2"
          onPress={() => router.back()}
        />

        <Link href="/" dismissTo className="mt-8">
          <Text className="font-satoshi text-forest text-center">Return to home screen</Text>
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
}
