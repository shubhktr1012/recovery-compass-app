import { View, Platform } from 'react-native';
import { useLinkBuilder } from '@react-navigation/native';
import { PlatformPressable } from '@react-navigation/elements';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { AppColors } from '@/constants/theme';

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const { buildHref } = useLinkBuilder();
    const insets = useSafeAreaInsets();

    return (
        <View className="absolute bottom-0 left-0 right-0 px-4 pb-0 items-center pointer-events-box-none">
            {/* 
         Note: We use absolute positioning. The content of screens needs padding bottom 
         to not be hidden behind this bar.
       */}
            <BlurView
                intensity={80}
                tint="light"
                className="flex-row justify-between items-center rounded-full overflow-hidden border border-white/20 shadow-sm w-full max-w-sm"
                style={{
                    backgroundColor: Platform.OS === 'android' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.85)',
                    height: 64,
                    elevation: 5, // Android shadow
                    shadowColor: AppColors.black,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 12,
                    marginBottom: Math.max(insets.bottom, 12),
                }}
            >
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];

                    const iconByRoute: Record<string, string> = {
                        index: 'house.fill',
                        program: 'list.bullet.rectangle.portrait.fill',
                        journal: 'book.fill',
                        profile: 'person.fill',
                    };
                    const iconName = iconByRoute[route.name] ?? 'circle.fill';

                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            if (process.env.EXPO_OS === 'ios') {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }
                            navigation.navigate(route.name, route.params);
                        }
                    };

                    const onLongPress = () => {
                        navigation.emit({
                            type: 'tabLongPress',
                            target: route.key,
                        });
                    };

                    return (
                        <PlatformPressable
                            key={route.key}
                            href={buildHref(route.name, route.params)}
                            accessibilityState={isFocused ? { selected: true } : {}}
                            accessibilityLabel={options.tabBarAccessibilityLabel}
                            onPress={onPress}
                            onLongPress={onLongPress}
                            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' }}
                        >
                            <View className={`items-center justify-center rounded-full transition-all duration-200 ${isFocused ? 'bg-forest scale-105' : 'bg-transparent'} w-10 h-10`}>
                                <IconSymbol
                                    name={iconName as any}
                                    size={22}
                                    color={isFocused ? AppColors.white : AppColors.iconMuted}
                                />
                            </View>
                        </PlatformPressable>
                    );
                })}
            </BlurView>
        </View>
    );
}
