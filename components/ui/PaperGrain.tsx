import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';

export function PaperGrain() {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 99 }]}>
      <Svg width="100%" height="100%" opacity={0.08}>
        <Defs>
          <Pattern id="grain" width="24" height="24" patternUnits="userSpaceOnUse">
            <Circle cx="3" cy="5" r="0.7" fill="#0f172a" opacity="0.18" />
            <Circle cx="12" cy="8" r="0.9" fill="#0f172a" opacity="0.12" />
            <Circle cx="19" cy="4" r="0.7" fill="#0f172a" opacity="0.16" />
            <Circle cx="6" cy="14" r="0.8" fill="#0f172a" opacity="0.1" />
            <Circle cx="15" cy="16" r="0.7" fill="#0f172a" opacity="0.14" />
            <Circle cx="21" cy="20" r="0.9" fill="#0f172a" opacity="0.12" />
            <Circle cx="9" cy="22" r="0.7" fill="#0f172a" opacity="0.15" />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#grain)" />
      </Svg>
    </View>
  );
}
