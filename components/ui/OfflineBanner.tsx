import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import React, { useEffect, useState } from 'react';
import Animated, { SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { Text, View } from 'react-native';

function isOfflineState(state: NetInfoState) {
  if (state.isConnected === false) {
    return true;
  }

  if (state.isInternetReachable === false) {
    return true;
  }

  return false;
}

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const updateConnectionState = (state: NetInfoState) => {
      if (!isMounted) return;
      setIsOffline(isOfflineState(state));
    };

    const unsubscribe = NetInfo.addEventListener(updateConnectionState);

    void NetInfo.fetch()
      .then(updateConnectionState)
      .catch((error) => {
        console.error('Failed to read network state', error);
      });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return (
    <View pointerEvents="box-none" className="absolute left-0 right-0 top-4 z-50">
      {isOffline ? (
        <Animated.View
          entering={SlideInUp.duration(220)}
          exiting={SlideOutUp.duration(180)}
          className="mx-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
        >
          <Text className="font-satoshi text-sm text-amber-800">
            You&apos;re offline — showing cached content
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}
