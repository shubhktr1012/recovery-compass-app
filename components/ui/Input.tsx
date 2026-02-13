import React, { forwardRef, useState } from 'react';
import { TextInput, View, Text, TextInputProps, TouchableOpacity } from 'react-native';
import { twMerge } from 'tailwind-merge';
import { AppColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerClassName?: string;
    isPassword?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(
    ({ label, error, className, containerClassName, isPassword, secureTextEntry, ...props }, ref) => {
        const [showPassword, setShowPassword] = useState(false);
        const isSecure = isPassword && !showPassword;

        return (
            <View className={twMerge('space-y-2', containerClassName)}>
                {label && (
                    <Text className="text-forest font-satoshi font-medium text-sm ml-1">
                        {label}
                    </Text>
                )}
                <View className="relative">
                    <TextInput
                        ref={ref}
                        className={twMerge(
                            'w-full bg-white/50 border border-gray-200 rounded-2xl px-4 py-3.5 text-base font-satoshi text-forest',
                            'focus:border-forest focus:bg-white transition-colors',
                            error && 'border-red-500 bg-red-50',
                            isPassword && 'pr-12', // Add padding for eye icon
                            className
                        )}
                        placeholderTextColor={AppColors.placeholderText}
                        secureTextEntry={isSecure}
                        {...props}
                    />
                    {isPassword && (
                        <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-0 bottom-0 justify-center"
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons
                                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                size={22}
                                color={AppColors.iconMuted}
                            />
                        </TouchableOpacity>
                    )}
                </View>
                {error && (
                    <Text className="text-red-500 text-xs ml-1 font-satoshi">
                        {error}
                    </Text>
                )}
            </View>
        );
    }
);

Input.displayName = 'Input';
