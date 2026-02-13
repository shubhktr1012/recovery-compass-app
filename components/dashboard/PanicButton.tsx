import { TouchableOpacity, View, Text } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BlurView } from 'expo-blur';
import { AppColors } from '@/constants/theme';

export function PanicButton() {
    return (
        <View className="absolute bottom-24 right-6 items-center z-50">
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => alert('Launching Panic Mode...')}
                className="rounded-full shadow-lg shadow-red-900/40"
                style={{
                    shadowColor: AppColors.danger,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                    elevation: 8
                }}
            >
                <BlurView
                    intensity={40}
                    tint="light"
                    className="w-16 h-16 rounded-full items-center justify-center bg-danger overflow-hidden border-2 border-white/20"
                >
                    <IconSymbol name="exclamationmark.triangle.fill" size={32} color="white" />
                </BlurView>
            </TouchableOpacity>
            <View className="bg-black/80 px-2 py-1 rounded-md mt-2">
                <Text className="text-white text-xs font-bold uppercase tracking-wider">SOS</Text>
            </View>
        </View>
    );
}
