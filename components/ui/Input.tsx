import React, { forwardRef } from 'react';
import { TextInput, View, Text, TextInputProps } from 'react-native';
import { twMerge } from 'tailwind-merge';
import { AppColors } from '@/constants/theme';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerClassName?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
    ({ label, error, className, containerClassName, ...props }, ref) => {
        return (
            <View className={twMerge('space-y-2', containerClassName)}>
                {label && (
                    <Text className="text-forest font-satoshi font-medium text-sm ml-1">
                        {label}
                    </Text>
                )}
                <TextInput
                    ref={ref}
                    className={twMerge(
                        'w-full bg-white/50 border border-gray-200 rounded-2xl px-4 py-3.5 text-base font-satoshi text-forest',
                        'focus:border-forest focus:bg-white transition-colors',
                        error && 'border-red-500 bg-red-50',
                        className
                    )}
                    placeholderTextColor={AppColors.placeholderText}
                    {...props}
                />
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
