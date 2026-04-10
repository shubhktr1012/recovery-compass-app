import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

const NOISE_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyBAMAAADsEZWCAAAAGFBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAANYy0DAAAACHRSTlMAAAAAAABhGj99KDAAAABqSURBVDjLpVJBDoAwCEMI/z/ag0cwsmXZoZdwIKXtjL1fQY5yA0l1C0J1C0J1C0J1C0J1C0J1C0J1C0J1C0J1C0J1C0J1C0J1C0J1C0J1C0J1C0J1C0J1C0J1C0J1C0J1C0J1C0J1C0A3XqIBz80AAAAASUVORK5CYII=';

export function PaperGrain() {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 99 }]}>
      <Image
        source={{ uri: NOISE_BASE64 }}
        style={{ width: '100%', height: '100%', opacity: 0.05 }}
        resizeMode="repeat"
      />
    </View>
  );
}
