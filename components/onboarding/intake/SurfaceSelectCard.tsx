import React, { useEffect, useRef } from 'react';
import { Pressable, Text, View, Animated, StyleSheet } from 'react-native';

interface SurfaceSelectCardProps {
  title: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
}

export function SurfaceSelectCard({ title, description, selected, onPress }: SurfaceSelectCardProps) {
  const opacity = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: selected ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [selected]);

  return (
    <Pressable onPress={onPress} style={{ marginBottom: 12 }}>
      <View style={[styles.card, selected ? styles.cardSelected : styles.cardUnselected]}>
        {/* Left accent bar when selected */}
        <Animated.View style={[styles.indicator, { opacity }]} />

        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderWidth: 1,
  },
  cardUnselected: {
    backgroundColor: '#ffffff',
    borderColor: 'rgba(6, 41, 12, 0.05)',
    shadowColor: 'rgba(6, 41, 12, 1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardSelected: {
    backgroundColor: '#F9FAF9',
    borderColor: 'rgba(6, 41, 12, 0.15)',
  },
  title: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    color: '#06290C',
  },
  description: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 14,
    color: 'rgba(6, 41, 12, 0.5)',
    marginTop: 6,
  },
  indicator: {
    position: 'absolute',
    left: 0,
    top: 12,
    bottom: 12,
    width: 3,
    borderRadius: 9999,
    backgroundColor: '#06290C',
  },
});
