import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Holding, Spot } from '../data/types';
import { photos } from '../data/photos';
import { formatDistance, ownershipLabel } from '../verify/format';
import { distanceM, type LatLng } from '../verify/geo';
import { pinState } from '../verify/pinState';
import { t } from '../ui/strings';
import { theme } from '../ui/theme';

type Props = {
  spot: Spot;
  holdings: Holding[];
  holdingsAvailable: boolean;
  position: LatLng | null;
  /** The local player's display name; empty until one is stored. */
  player: string;
  /** Claim is enabled only when this is set: the app has a position and the player identity has loaded. */
  onClaim: (() => void) | null;
  /** Location permission was refused, so Claim can never enable. */
  locationDenied: boolean;
  onClose: () => void;
};

const STORY_PREVIEW_LINES = 3;

export function SpotSheet({ spot, holdings, holdingsAvailable, position, player, onClaim, locationDenied, onClose }: Props) {
  const [expanded, setExpanded] = useState(false);
  const state = pinState(spot, holdings, player);
  const owner = holdings.find((h) => h.spot_id === spot.id)?.player ?? null;
  const distance = position ? distanceM(position, spot) : null;
  const heading = spot.heading === null ? t('headingUnknown') : `${Math.round(spot.heading)}°`;
  const story = spot.story.en;

  return (
    <View style={styles.card}>
      <Pressable onPress={onClose} style={styles.close} accessibilityLabel={t('close')} hitSlop={12}>
        <Text style={styles.closeText}>×</Text>
      </Pressable>
      <View style={styles.headerRow}>
        <Image source={photos[spot.photo]} style={styles.photo} resizeMode="cover" />
        <View style={styles.titleColumn}>
          <Text style={styles.name}>{spot.name.en}</Text>
          {spot.teaser.en ? <Text style={styles.teaser}>{spot.teaser.en}</Text> : null}
        </View>
      </View>
      {story ? (
        <Text style={styles.story} numberOfLines={expanded ? undefined : STORY_PREVIEW_LINES}>
          {story}
        </Text>
      ) : null}
      <View style={styles.badgeRow}>
        <Text style={[styles.badge, styles.pointsBadge]}>{spot.points} {t('points')}</Text>
        <Text style={[styles.badge, styles.ownershipBadge]}>
          {ownershipLabel(state, owner, holdingsAvailable)}
        </Text>
      </View>
      <Text style={styles.meta}>{formatDistance(distance)} · {heading}</Text>
      <View style={styles.buttonRow}>
        <Pressable
          onPress={onClaim ?? undefined}
          disabled={onClaim === null}
          style={[styles.claim, onClaim === null && styles.claimDisabled]}
          accessibilityRole="button"
          accessibilityState={{ disabled: onClaim === null }}
        >
          <Text style={styles.claimText}>{t('claim')}</Text>
        </Pressable>
        {story ? (
          <Pressable
            onPress={() => setExpanded((e) => !e)}
            style={styles.moreInfo}
            accessibilityRole="button"
            accessibilityState={{ expanded }}
          >
            <Text style={styles.moreInfoText}>{t('moreInfo')}</Text>
          </Pressable>
        ) : null}
      </View>
      {locationDenied ? <Text style={styles.hint}>{t('locationNeeded')}</Text> : null}
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
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  close: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: theme.text, fontSize: 18, lineHeight: 20 },
  headerRow: { flexDirection: 'row', gap: 12, paddingRight: 28 },
  photo: { width: 96, height: 96, borderRadius: 12 },
  titleColumn: { flex: 1, justifyContent: 'center', gap: 2 },
  name: { fontSize: 20, fontWeight: '700', color: theme.text },
  teaser: { color: theme.muted },
  story: { color: theme.text, lineHeight: 20 },
  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  badge: {
    fontWeight: '700',
    fontSize: 13,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  pointsBadge: { backgroundColor: theme.badgePoints, color: theme.text },
  ownershipBadge: { backgroundColor: theme.badgeOwnership, color: theme.primary },
  meta: { color: theme.muted, fontSize: 13 },
  buttonRow: { flexDirection: 'row', gap: 10 },
  claim: {
    flex: 1,
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  claimDisabled: { opacity: theme.disabledOpacity },
  hint: { color: theme.muted, fontSize: 13, textAlign: 'center' },
  claimText: { color: theme.white, fontWeight: '700', fontSize: 16 },
  moreInfo: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  moreInfoText: { color: theme.primary, fontWeight: '700', fontSize: 16 },
});
