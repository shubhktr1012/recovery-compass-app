import React from 'react';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
  onReset?: () => void;
  resetKeys?: unknown[];
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  public state: AppErrorBoundaryState = {
    hasError: false,
  };

  public static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App error boundary caught an error:', error, errorInfo);
  }

  public componentDidUpdate(prevProps: AppErrorBoundaryProps) {
    if (!this.state.hasError) return;

    if (!this.props.resetKeys || !prevProps.resetKeys) return;
    if (this.props.resetKeys.length !== prevProps.resetKeys.length) {
      this.resetErrorBoundary();
      return;
    }

    const hasResetKeyChanged = this.props.resetKeys.some((key, index) => key !== prevProps.resetKeys?.[index]);
    if (hasResetKeyChanged) {
      this.resetErrorBoundary();
    }
  }

  private resetErrorBoundary = () => {
    this.setState({ hasError: false });
    this.props.onReset?.();
  };

  private handleRetry = () => {
    this.resetErrorBoundary();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView className="flex-1 bg-surface">
          <View className="flex-1 items-center justify-center px-6">
            <Text className="font-erode-bold text-3xl text-forest text-center mb-3">Something went wrong</Text>
            <Text className="font-satoshi text-gray-500 text-center mb-8">
              Recovery Compass hit an unexpected error. Try reloading this screen.
            </Text>
            <TouchableOpacity
              onPress={this.handleRetry}
              activeOpacity={0.85}
              className="bg-forest rounded-2xl px-6 py-4"
            >
              <Text className="font-satoshi-bold text-white text-base">Try Again</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}
