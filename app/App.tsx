import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MAP_PROVIDER, SpotMap } from './src/components/SpotMap';
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
      <SpotMap spots={spots} holdings={holdings} showsUserLocation={granted} onSelect={setSelected} />
      <View style={styles.header} pointerEvents="none">
        <Text style={styles.wordmark}>{t('appName')}</Text>
      </View>
      {selected && (
        <SpotSheet
          spot={selected}
          holdings={holdings}
          holdingsAvailable={available}
          position={position}
          onClose={() => setSelected(null)}
        />
      )}
      <View style={styles.attribution} pointerEvents="none">
        <Text style={styles.attributionText}>{t('attribution')} {MAP_PROVIDER}</Text>
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
    left: 16,
    backgroundColor: theme.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  wordmark: { color: theme.white, fontWeight: '800', fontSize: 18, letterSpacing: 1 },
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
