import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MAP_ATTRIBUTION, SpotMap } from './src/components/SpotMap';
import { SpotSheet } from './src/components/SpotSheet';
import { spots } from './src/data/spots';
import type { Spot } from './src/data/types';
import { useHoldings } from './src/hooks/useHoldings';
import { usePosition } from './src/hooks/usePosition';
import { t } from './src/ui/strings';
import { theme } from './src/ui/theme';

export default function App() {
  const [selected, setSelected] = useState<Spot | null>(null);
  const { holdings, available, refresh } = useHoldings();
  const { granted, position } = usePosition();

  useEffect(() => {
    if (selected) refresh();
  }, [selected, refresh]);

  return (
    <View style={styles.container}>
      <SpotMap
        spots={spots}
        holdings={holdings}
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
          onClose={() => setSelected(null)}
        />
      )}
      <View style={styles.attribution} pointerEvents="none">
        <Text style={styles.attributionText}>{t('attribution')} {MAP_ATTRIBUTION}</Text>
      </View>
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
