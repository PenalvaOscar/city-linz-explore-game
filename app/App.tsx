import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ClaimFlow } from './src/components/claim/ClaimFlow';
import { MAP_ATTRIBUTION, SpotMap } from './src/components/SpotMap';
import { SpotSheet } from './src/components/SpotSheet';
import { spots } from './src/data/spots';
import type { Spot } from './src/data/types';
import { useHoldings } from './src/hooks/useHoldings';
import { usePlayer } from './src/hooks/usePlayer';
import { usePosition } from './src/hooks/usePosition';
import { DEFAULT_THRESHOLDS, RELAXED_THRESHOLDS } from './src/verify/thresholds';
import { t } from './src/ui/strings';
import { theme } from './src/ui/theme';

// Desk development only; see .env.example. Read once here so the verify module stays environment-free.
const thresholds = process.env.EXPO_PUBLIC_RELAXED_GATES ? RELAXED_THRESHOLDS : DEFAULT_THRESHOLDS;

export default function App() {
  const [selected, setSelected] = useState<Spot | null>(null);
  const [claiming, setClaiming] = useState<Spot | null>(null);
  const { holdings, available, refresh } = useHoldings();
  const { granted, denied, position } = usePosition();
  const player = usePlayer();
  const me = player.name ?? '';

  useEffect(() => {
    if (selected) refresh();
  }, [selected, refresh]);

  const canClaim = position !== null && player.loaded;

  return (
    <View style={styles.container}>
      <SpotMap
        spots={spots}
        holdings={holdings}
        player={me}
        showsUserLocation={granted}
        position={position}
        onSelect={setSelected}
      />
      <View style={styles.header} pointerEvents="none">
        <Text style={styles.wordmark}>{t('appName')}</Text>
        <Text style={styles.tagline}>{t('tagline')}</Text>
      </View>
      {selected && (
        <SpotSheet
          key={selected.id}
          spot={selected}
          holdings={holdings}
          holdingsAvailable={available}
          position={position}
          player={me}
          onClaim={canClaim ? () => setClaiming(selected) : null}
          locationDenied={denied}
          onClose={() => setSelected(null)}
        />
      )}
      <View style={styles.attribution} pointerEvents="none">
        <Text style={styles.attributionText}>{t('attribution')} {MAP_ATTRIBUTION}</Text>
      </View>
      {claiming && (
        <ClaimFlow
          key={claiming.id}
          spot={claiming}
          player={player.name}
          setPlayer={player.setName}
          thresholds={thresholds}
          onClose={() => setClaiming(null)}
          onDone={() => {
            setClaiming(null);
            setSelected(null);
            refresh();
          }}
          onSaved={refresh}
        />
      )}
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: {
    position: 'absolute',
    top: 56,
    left: 12,
    right: 12,
    backgroundColor: theme.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  wordmark: { color: theme.primary, fontWeight: '800', fontSize: 22, letterSpacing: 1 },
  tagline: { color: theme.text, fontSize: 14, marginTop: 2 },
  attribution: {
    position: 'absolute',
    bottom: 24,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  attributionText: { fontSize: 10, color: theme.muted },
});
