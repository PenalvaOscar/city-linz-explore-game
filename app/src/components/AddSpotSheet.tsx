import React, { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { LatLng } from '../verify/geo';
import { saveNewSpot } from '../data/remoteSpots';
import type { Spot } from '../data/types';
import { t } from '../ui/strings';
import { theme } from '../ui/theme';

type Props = { position: LatLng | null; onCreated: (spot: Spot) => void; onClose: () => void };

export function AddSpotSheet({ position, onCreated, onClose }: Props) {
  const [name, setName] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert(t('cameraPermissionTitle'), t('cameraPermissionMessage'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8, exif: true });
    if (!result.canceled) setPhotoUri(result.assets[0]?.uri ?? null);
  };

  const save = async () => {
    if (!position || position.heading === null || position.heading === undefined || !name.trim() || !photoUri) return;
    setSaving(true);
    try {
      onCreated(await saveNewSpot({ name, lat: position.lat, lng: position.lng, heading: position.heading, photoUri }));
    } catch {
      Alert.alert(t('spotSaveFailed'), t('spotSaveFailedMessage'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t('addSpot')}</Text>
      <TextInput value={name} onChangeText={setName} placeholder={t('spotName')} style={styles.input} />
      {photoUri ? <Image source={{ uri: photoUri }} style={styles.preview} /> : null}
      <View style={styles.row}>
        <Pressable onPress={takePhoto} style={styles.secondary}>
          <Text>{photoUri ? t('retakePhoto') : t('takePhoto')}</Text>
        </Pressable>
        <Pressable onPress={save} disabled={saving || !position || position.heading === null || position.heading === undefined || !name.trim() || !photoUri} style={styles.primary}>
          <Text style={styles.primaryText}>{saving ? t('saving') : t('saveSpot')}</Text>
        </Pressable>
      </View>
      <Pressable onPress={onClose}><Text style={styles.cancel}>{t('close')}</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { position: 'absolute', left: 12, right: 12, bottom: 48, backgroundColor: theme.white, borderRadius: 16, padding: 14, gap: 10, elevation: 6 },
  title: { fontSize: 20, fontWeight: '700', color: theme.text },
  input: { borderWidth: 1, borderColor: theme.border, borderRadius: 10, padding: 10 },
  preview: { width: '100%', height: 180, borderRadius: 12 },
  row: { flexDirection: 'row', gap: 10 },
  primary: { flex: 1, backgroundColor: theme.primary, borderRadius: 10, padding: 12, alignItems: 'center' },
  primaryText: { color: theme.white, fontWeight: '700' },
  secondary: { flex: 1, borderWidth: 1, borderColor: theme.primary, borderRadius: 10, padding: 12, alignItems: 'center' },
  cancel: { textAlign: 'center', color: theme.muted },
});
