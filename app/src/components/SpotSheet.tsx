import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Holding, Spot } from '../data/types';
import { photos } from '../data/photos';
import { formatDistance, ownershipLabel } from '../verify/format';
import { distanceM, type LatLng } from '../verify/geo';
import { NO_PLAYER, pinState } from '../verify/pinState';
import { t } from '../ui/strings';
import { theme } from '../ui/theme';

type Props = {
  spot: Spot;
  holdings: Holding[];
  holdingsAvailable: boolean;
  position: LatLng | null;
  onClose: () => void;
};

export function SpotSheet({ spot, holdings, holdingsAvailable, position, onClose }: Props) {
  const state = pinState(spot, holdings, NO_PLAYER);
  const owner = holdings.find((h) => h.spot_id === spot.id)?.player ?? null;
  const distance = position ? distanceM(position, spot) : null;
  const heading = spot.heading === null ? t('headingUnknown') : `${Math.round(spot.heading)}°`;

  return (
    <View style={styles.card}>
      <Image source={photos[spot.photo]} style={styles.photo} resizeMode="cover" />
      <Pressable onPress={onClose} style={styles.close} accessibilityLabel={t('close')} hitSlop={12}>
        <Text style={styles.closeText}>×</Text>
      </Pressable>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.name}>{spot.name.en}</Text>
          <Text style={styles.points}>{spot.points} {t('points')}</Text>
        </View>
        {spot.teaser.en ? <Text style={styles.teaser}>{spot.teaser.en}</Text> : null}
        <Text style={styles.meta}>{ownershipLabel(state, owner, holdingsAvailable)}</Text>
        <Text style={styles.meta}>{formatDistance(distance)} · {heading}</Text>
        <View style={styles.claim} accessibilityRole="button" accessibilityState={{ disabled: true }}>
          <Text style={styles.claimText}>{t('claim')}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 48,
    backgroundColor: theme.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  photo: { width: '100%', height: 180 },
  close: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: theme.white, fontSize: 20, lineHeight: 22 },
  body: { padding: 14, gap: 6 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 20, fontWeight: '700', color: theme.text, flexShrink: 1 },
  points: {
    backgroundColor: theme.accentYellow,
    color: theme.text,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  teaser: { color: theme.muted },
  meta: { color: theme.text },
  claim: {
    marginTop: 8,
    backgroundColor: theme.primary,
    opacity: 0.4,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  claimText: { color: theme.white, fontWeight: '700', fontSize: 16 },
});
