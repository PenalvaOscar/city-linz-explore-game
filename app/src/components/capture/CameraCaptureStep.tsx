import React, { useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { CaptureStepProps } from '../claim/CaptureStep';
import { photos } from '../../data/photos';
import { headingTurn } from '../../verify/geo';
import { headingBand } from '../../verify/headingBand';
import { t } from '../../ui/strings';
import { bandColor, theme } from '../../ui/theme';

const GHOST_OPACITY = 0.35;

/**
 * The capture step of the claim flow (#10): asks for camera permission on entry, shows the back
 * camera with the spot's reference photo ghosted over it, and a heading indicator that unlocks the
 * shutter only when the phone faces the reference heading. Hands the JPEG's file URI to the flow.
 */
export function CameraCaptureStep({ spot, heading, thresholds, onCapture, onCancel }: CaptureStepProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ghost, setGhost] = useState(true);

  // Permission is asked the moment the step opens; `permission` is null until the status loads.
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) requestPermission();
  }, [permission?.status]);

  const shoot = async () => {
    if (!camera.current || busy) return;
    setBusy(true);
    setFailed(false);
    try {
      const photo = await camera.current.takePictureAsync({ quality: 0.6 });
      onCapture(photo.uri);
    } catch {
      setFailed(true);
      setBusy(false);
    }
  };

  // Android's first refusal leaves `canAskAgain` true; the status alone says whether we were refused.
  const denied = permission?.status === 'denied';

  // The heading gate is skipped on a headless spot; otherwise the shutter follows the band.
  const gated = spot.heading !== null;
  const turn = spot.heading !== null && heading !== null ? headingTurn(heading, spot.heading) : null;
  const band = headingBand(turn === null ? null : Math.abs(turn), thresholds);
  const facing = !gated || band === 'green';
  const locked = !ready || busy || !facing;

  let indicator: string;
  if (!gated) indicator = t('captureTargetNone');
  else if (turn === null) indicator = t('calibrateCompass');
  else if (Math.round(Math.abs(turn)) === 0) indicator = t('onTarget');
  else indicator = t(turn < 0 ? 'turnLeft' : 'turnRight', { degrees: Math.round(Math.abs(turn)) });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{spot.name.en}</Text>
      <View style={styles.viewfinder}>
        {permission?.granted ? (
          <>
            <CameraView ref={camera} style={StyleSheet.absoluteFill} facing="back" onCameraReady={() => setReady(true)} />
            {ghost ? (
              <Image
                source={photos[spot.photo]}
                style={[StyleSheet.absoluteFill, styles.ghost]}
                resizeMode="contain"
              />
            ) : null}
            <Pressable onPress={() => setGhost((g) => !g)} style={styles.ghostToggle} accessibilityRole="button" hitSlop={8}>
              <Text style={styles.ghostToggleText}>{t(ghost ? 'ghostHide' : 'ghostShow')}</Text>
            </Pressable>
          </>
        ) : (
          <Text style={styles.viewfinderText}>{denied ? t('cameraDenied') : t('cameraAsking')}</Text>
        )}
      </View>
      <View style={styles.indicator}>
        {gated ? (
          <Text
            style={[styles.arrow, { color: bandColor[band], transform: [{ rotate: `${turn ?? 0}deg` }] }]}
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
            ↑
          </Text>
        ) : null}
        <Text style={[styles.indicatorText, { color: bandColor[band] }]}>{indicator}</Text>
      </View>
      {failed ? <Text style={styles.error}>{t('captureFailed')}</Text> : null}
      <Pressable
        onPress={shoot}
        disabled={locked}
        style={[styles.capture, locked && styles.captureDisabled]}
        accessibilityRole="button"
        accessibilityState={{ disabled: locked }}
      >
        <Text style={styles.captureText}>{t('capture')}</Text>
      </Pressable>
      <Pressable onPress={onCancel} style={styles.cancel} accessibilityRole="button">
        <Text style={styles.cancelText}>{t('backToMap')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', padding: 24, gap: 12 },
  title: { fontSize: 22, fontWeight: '700', color: theme.text },
  viewfinder: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: theme.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinderText: { color: theme.white, textAlign: 'center', padding: 24 },
  ghost: { opacity: GHOST_OPACITY },
  ghostToggle: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: theme.backdrop,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  ghostToggleText: { color: theme.white, fontWeight: '700', fontSize: 13 },
  indicator: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  arrow: { fontSize: 36, fontWeight: '800', lineHeight: 40 },
  indicatorText: { fontSize: 18, fontWeight: '700', flexShrink: 1 },
  error: { color: theme.error },
  capture: {
    marginTop: 12,
    backgroundColor: theme.primary,
    borderRadius: 40,
    paddingHorizontal: 40,
    paddingVertical: 18,
  },
  captureDisabled: { opacity: theme.disabledOpacity },
  captureText: { color: theme.white, fontWeight: '700', fontSize: 18 },
  cancel: { padding: 12 },
  cancelText: { color: theme.primary, fontWeight: '700' },
});
