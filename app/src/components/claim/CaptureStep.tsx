import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Spot } from '../../data/types';
import { t } from '../../ui/strings';
import { theme } from '../../ui/theme';

/**
 * Contract of the capture step. The camera ticket (#10) implements a component with these props;
 * the placeholder below fulfils it with a plain button and no photo.
 */
export type CaptureStepProps = {
  spot: Spot;
  /** Latest compass reading, null when the device gives none. */
  heading: number | null;
  /** Called with the photo's file URI, or null when no photo was taken. */
  onCapture: (photoUri: string | null) => void;
  onCancel: () => void;
};

const degrees = (h: number) => `${Math.round(h)}°`;

export function PlaceholderCaptureStep({ spot, heading, onCapture, onCancel }: CaptureStepProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{spot.name.en}</Text>
      <Text style={styles.reading}>
        {heading === null ? t('captureHeadingNone') : t('captureHeading', { heading: degrees(heading) })}
      </Text>
      <Text style={styles.target}>
        {spot.heading === null ? t('captureTargetNone') : t('captureTarget', { heading: degrees(spot.heading) })}
      </Text>
      <Pressable onPress={() => onCapture(null)} style={styles.capture} accessibilityRole="button">
        <Text style={styles.captureText}>{t('capture')}</Text>
      </Pressable>
      <Pressable onPress={onCancel} style={styles.cancel} accessibilityRole="button">
        <Text style={styles.cancelText}>{t('backToMap')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 22, fontWeight: '700', color: theme.text },
  reading: { fontSize: 28, fontWeight: '800', color: theme.primary },
  target: { color: theme.muted },
  capture: {
    marginTop: 24,
    backgroundColor: theme.primary,
    borderRadius: 40,
    paddingHorizontal: 40,
    paddingVertical: 18,
  },
  captureText: { color: theme.white, fontWeight: '700', fontSize: 18 },
  cancel: { marginTop: 12, padding: 12 },
  cancelText: { color: theme.primary, fontWeight: '700' },
});
