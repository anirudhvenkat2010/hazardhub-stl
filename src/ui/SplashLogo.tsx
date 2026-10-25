import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { darkColors, fonts } from '@/ui/theme';

/**
 * Branded launch screen shown over the app while fonts load. Uses the dark
 * palette (matches the native splash in app.json) so there's no flash.
 */
export function SplashLogo() {
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 420, useNativeDriver: true }),
    ]).start();
  }, [fade, rise]);

  return (
    <View style={styles.root}>
      <Animated.View style={{ opacity: fade, transform: [{ translateY: rise }], alignItems: 'center' }}>
        <View style={styles.mark}>
          <View style={styles.road} />
          <Ionicons name="location" size={54} color={darkColors.accent} style={styles.pin} />
        </View>
        <Text style={styles.word}>HazardHub</Text>
        <Text style={styles.tag}>Report a road hazard in St. Louis</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: darkColors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: { width: 120, height: 92, alignItems: 'center', justifyContent: 'flex-end', marginBottom: 28 },
  road: {
    width: 108,
    height: 40,
    borderRadius: 10,
    backgroundColor: darkColors.surfaceAlt,
  },
  pin: { position: 'absolute', top: -6 },
  word: { fontFamily: fonts.extrabold, fontSize: 34, letterSpacing: -0.8, color: darkColors.text },
  tag: { fontFamily: fonts.medium, fontSize: 15, color: darkColors.accent, marginTop: 6 },
});
