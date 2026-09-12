import React, { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
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

const STORY_PREVIEW_LINES = 3;

export function SpotSheet({ spot, holdings, holdingsAvailable, position, onClose }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);

  const state = pinState(spot, holdings, NO_PLAYER);
  const owner = holdings.find((h) => h.spot_id === spot.id)?.player ?? null;
  const distance = position ? distanceM(position, spot) : null;
  const heading = spot.heading === null ? t('headingUnknown') : `${Math.round(spot.heading)}°`;
  const story = spot.story.en;

  const handleClaim = async () => {
    if (!position) {
      Alert.alert(t('claimUnavailable'), t('claimRequireLocation'));
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert(t('cameraPermissionTitle'), t('cameraPermissionMessage'));
      return;
    }

    setIsTakingPhoto(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        exif: true,
      });

      if (result.canceled) return;

      const uri = result.assets?.[0]?.uri ?? null;
      if (!uri) {
        Alert.alert(t('claimUnavailable'), t('captureFailed'));
        return;
      }

      setPhotoUri(uri);
    } catch (error) {
      Alert.alert(t('claimUnavailable'), t('captureFailed'));
    } finally {
      setIsTakingPhoto(false);
    }
  };

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
      {photoUri ? <Image source={{ uri: photoUri }} style={styles.capturedPhoto} resizeMode="cover" /> : null}
      <View style={styles.buttonRow}>
        <Pressable
          onPress={handleClaim}
          disabled={!position || isTakingPhoto}
          style={[styles.claim, (!position || isTakingPhoto) && styles.claimDisabled]}
          accessibilityRole="button"
          accessibilityState={{ disabled: !position || isTakingPhoto }}
        >
          <Text style={styles.claimText}>{isTakingPhoto ? t('takingPhoto') : t('claim')}</Text>
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
  claimText: { color: theme.white, fontWeight: '700', fontSize: 16 },
  capturedPhoto: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    backgroundColor: theme.border,
  },
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
