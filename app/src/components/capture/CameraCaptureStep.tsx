import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { CaptureStepProps } from '../claim/CaptureStep';
import { t } from '../../ui/strings';
import { theme } from '../../ui/theme';

const degrees = (h: number) => `${Math.round(h)}°`;

/**
 * The capture step of the claim flow (#10): asks for camera permission on entry, shows the back
 * camera and hands the JPEG's file URI to the flow. Verification stays in the flow; the shutter is
 * always available once the camera is ready.
 */
export function CameraCaptureStep({ spot, heading, onCapture, onCancel }: CaptureStepProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

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

  const denied = permission !== null && !permission.granted && !permission.canAskAgain;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{spot.name.en}</Text>
      <View style={styles.viewfinder}>
        {permission?.granted ? (
          <CameraView ref={camera} style={StyleSheet.absoluteFill} facing="back" onCameraReady={() => setReady(true)} />
        ) : (
          <Text style={styles.viewfinderText}>{denied ? t('cameraDenied') : t('cameraAsking')}</Text>
        )}
      </View>
      <Text style={styles.reading}>
        {heading === null ? t('captureHeadingNone') : t('captureHeading', { heading: degrees(heading) })}
      </Text>
      <Text style={styles.target}>
        {spot.heading === null ? t('captureTargetNone') : t('captureTarget', { heading: degrees(spot.heading) })}
      </Text>
      {failed ? <Text style={styles.error}>{t('captureFailed')}</Text> : null}
      <Pressable
        onPress={shoot}
        disabled={!ready || busy}
        style={[styles.capture, (!ready || busy) && styles.captureDisabled]}
        accessibilityRole="button"
        accessibilityState={{ disabled: !ready || busy }}
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
  reading: { fontSize: 28, fontWeight: '800', color: theme.primary },
  target: { color: theme.muted },
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
