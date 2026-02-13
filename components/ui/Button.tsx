import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps } from 'react-native';
import { twMerge } from 'tailwind-merge';
import * as Haptics from 'expo-haptics';
import { AppColors } from '@/constants/theme';

interface ButtonProps extends TouchableOpacityProps {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
    size?: 'sm' | 'md' | 'lg';
    label: string;
    loading?: boolean;
    textClassName?: string;
    icon?: React.ReactNode;
}

export function Button({
    variant = 'primary',
    size = 'md',
    label,
    loading = false,
    className,
    textClassName,
    icon,
    onPress,
    disabled,
    ...props
}: ButtonProps) {
    const baseStyles = 'flex-row items-center justify-center rounded-2xl active:opacity-90 transition-opacity';

    const variants = {
        primary: 'bg-forest border border-transparent',
        secondary: 'bg-sage border border-transparent',
        outline: 'bg-transparent border border-forest',
        ghost: 'bg-transparent border-transparent',
        destructive: 'bg-red-600 border-transparent',
    };

    const sizes = {
        sm: 'px-4 py-2',
        md: 'px-6 py-3.5',
        lg: 'px-8 py-4',
    };

    const textVariants = {
        primary: 'text-white font-medium',
        secondary: 'text-forest font-medium',
        outline: 'text-forest font-medium',
        ghost: 'text-forest font-medium',
        destructive: 'text-white font-medium',
    };

    const textSizes = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
    };

    const handlePress = (e: any) => {
        if (disabled || loading) return;
        Haptics.selectionAsync();
        onPress?.(e);
    };

    return (
        <TouchableOpacity
            className={twMerge(
                baseStyles,
                variants[variant],
                sizes[size],
                (disabled || loading) && 'opacity-50',
                className
            )}
            onPress={handlePress}
            disabled={disabled || loading}
            activeOpacity={0.8}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'primary' ? 'white' : AppColors.forest} />
            ) : (
                <>
                    {icon && <>{icon}</>}
                    <Text
                        className={twMerge(
                            'font-satoshi',
                            textVariants[variant],
                            textSizes[size],
                            textClassName
                        )}
                    >
                        {label}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
}
