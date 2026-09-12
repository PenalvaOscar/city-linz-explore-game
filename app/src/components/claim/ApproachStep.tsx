import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ClaimState } from '../../verify/claimMachine';
import { formatDistance } from '../../verify/format';
import { t } from '../../ui/strings';
import { theme } from '../../ui/theme';

type Props = { state: ClaimState };

/** The settling, approaching and dwelling steps: one screen, three readouts. */
export function ApproachStep({ state }: Props) {
  const { step, spot, thresholds, distanceM, dwellS } = state;
  const range = thresholds.distancePassM;

  let headline: string;
  let detail: string;
  if (step === 'settling') {
    headline = t('gpsSettling');
    detail = t('gpsSettlingHint', { accuracy: thresholds.accuracyMaxM });
  } else if (step === 'approaching') {
    headline = t('walkCloser');
    detail = t('awayFrom', { distance: formatDistance(distanceM), range });
  } else {
    headline = t('stayHere');
    detail = t('dwellHint', { range });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.spot}>{spot.name.en}</Text>
      <Text style={styles.headline}>{headline}</Text>
      {step === 'dwelling' ? (
        <Text style={styles.countdown}>
          {t('dwellCountdown', { seconds: Math.max(thresholds.dwellMinS - dwellS, 0) })}
        </Text>
      ) : null}
      <Text style={styles.detail}>{detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  spot: { fontSize: 16, color: theme.muted },
  headline: { fontSize: 28, fontWeight: '800', color: theme.text, textAlign: 'center' },
  countdown: { fontSize: 64, fontWeight: '800', color: theme.primary },
  detail: { color: theme.muted, textAlign: 'center', fontSize: 15 },
});
