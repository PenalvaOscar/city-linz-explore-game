import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ClaimState } from '../../verify/claimMachine';
import { gateFailureLines, outcomeLabel } from '../../verify/resultCopy';
import { t } from '../../ui/strings';
import { theme } from '../../ui/theme';

type Props = {
  state: ClaimState;
  player: string;
  onDone: () => void;
  onTryAgain: () => void;
  onRetrySave: () => void;
  onBack: () => void;
};

/** The passed, failed and saveError steps. */
export function ResultStep({ state, player, onDone, onTryAgain, onRetrySave, onBack }: Props) {
  const { step, spot, result, reading, saved, thresholds, photoUri } = state;
  const photo = photoUri ? <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" /> : null;

  if (step === 'passed' && saved) {
    return (
      <View style={styles.container}>
        <Text style={[styles.title, styles.passed]}>{outcomeLabel(saved.previousOwner, player)}</Text>
        {photo}
        <Text style={styles.spot}>{spot.name.en}</Text>
        <Text style={styles.points}>{t('pointsHeld', { points: spot.points })}</Text>
        <Pressable onPress={onDone} style={styles.primary} accessibilityRole="button">
          <Text style={styles.primaryText}>{t('done')}</Text>
        </Pressable>
      </View>
    );
  }

  if (step === 'saveError') {
    return (
      <View style={styles.container}>
        <Text style={[styles.title, styles.failed]}>{t('saveError')}</Text>
        <Text style={styles.detail}>{t('saveErrorHint')}</Text>
        <Pressable onPress={onRetrySave} style={styles.primary} accessibilityRole="button">
          <Text style={styles.primaryText}>{t('retry')}</Text>
        </Pressable>
        <Pressable onPress={onBack} style={styles.secondary} accessibilityRole="button">
          <Text style={styles.secondaryText}>{t('backToMap')}</Text>
        </Pressable>
      </View>
    );
  }

  const lines = result && reading ? gateFailureLines(result, reading, thresholds) : [];
  return (
    <View style={styles.container}>
      <Text style={[styles.title, styles.failed]}>{t('notThisTime')}</Text>
      {photo}
      <Text style={styles.spot}>{spot.name.en}</Text>
      <View style={styles.lines}>
        {lines.map((line) => (
          <Text key={line} style={styles.line}>
            {line}
          </Text>
        ))}
      </View>
      <Pressable onPress={onTryAgain} style={styles.primary} accessibilityRole="button">
        <Text style={styles.primaryText}>{t('tryAgain')}</Text>
      </Pressable>
      <Pressable onPress={onBack} style={styles.secondary} accessibilityRole="button">
        <Text style={styles.secondaryText}>{t('backToMap')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 30, fontWeight: '800', textAlign: 'center' },
  passed: { color: theme.success },
  failed: { color: theme.error },
  photo: { width: 180, aspectRatio: 3 / 4, borderRadius: 12, backgroundColor: theme.border },
  spot: { fontSize: 18, color: theme.text },
  points: { fontSize: 22, fontWeight: '700', color: theme.primary },
  detail: { color: theme.muted, textAlign: 'center' },
  lines: { gap: 6, alignSelf: 'stretch' },
  line: { color: theme.text, fontSize: 16, textAlign: 'center' },
  primary: {
    marginTop: 16,
    alignSelf: 'stretch',
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryText: { color: theme.white, fontWeight: '700', fontSize: 16 },
  secondary: { alignSelf: 'stretch', paddingVertical: 12, alignItems: 'center' },
  secondaryText: { color: theme.primary, fontWeight: '700', fontSize: 16 },
});
