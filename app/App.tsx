import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ClaimFlow } from './src/components/claim/ClaimFlow';
import { MAP_ATTRIBUTION, SpotMap } from './src/components/SpotMap';
import { SpotSheet } from './src/components/SpotSheet';
import { AddSpotSheet } from './src/components/AddSpotSheet';
import { spots } from './src/data/spots';
import { loadRemoteSpots } from './src/data/remoteSpots';
import type { Spot } from './src/data/types';
import { useHoldings } from './src/hooks/useHoldings';
import { usePlayer } from './src/hooks/usePlayer';
import { usePosition } from './src/hooks/usePosition';
import { applyDecay } from './src/verify/decay';
import { DEFAULT_THRESHOLDS, RELAXED_THRESHOLDS } from './src/verify/thresholds';
import { t } from './src/ui/strings';
import { theme } from './src/ui/theme';

// Desk development only; see .env.example. Read once here so the verify module stays environment-free.
const thresholds = process.env.EXPO_PUBLIC_RELAXED_GATES ? RELAXED_THRESHOLDS : DEFAULT_THRESHOLDS;

export default function App() {
  const [selected, setSelected] = useState<Spot | null>(null);
  const [claiming, setClaiming] = useState<Spot | null>(null);
  const [addingSpot, setAddingSpot] = useState(false);
  const [mapSpots, setMapSpots] = useState(spots);
  const { holdings: rawHoldings, available, refresh } = useHoldings();
  // Decay is applied once here, at the time of each holdings read; everything below sees only live holdings.
  const holdings = useMemo(() => applyDecay(rawHoldings, new Date()), [rawHoldings]);
  const { granted, denied, position } = usePosition();
  const player = usePlayer();
  const me = player.name ?? '';

  useEffect(() => {
    loadRemoteSpots()
      .then((remoteSpots) => {
        setMapSpots((current) => {
          const existing = new Set(current.map((spot) => spot.id));
          return [...current, ...remoteSpots.filter((spot) => !existing.has(spot.id))];
        });
      })
      .catch(() => {
        // Bundled spots remain usable when Supabase is not configured.
      });
  }, []);

  useEffect(() => {
    if (selected) refresh();
  }, [selected, refresh]);

  const canClaim = position !== null && player.loaded;

  return (
    <View style={styles.container}>
      <SpotMap
        spots={mapSpots}
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
      <Pressable onPress={() => { setSelected(null); setAddingSpot(true); }} style={styles.addSpot}>
        <Text style={styles.addSpotText}>+</Text>
        <Text style={styles.addSpotLabel}>{t('addSpot')}</Text>
      </Pressable>
      {addingSpot && (
        <AddSpotSheet
          position={position}
          onClose={() => setAddingSpot(false)}
          onCreated={(spot) => {
            setMapSpots((current) => [...current, spot]);
            setAddingSpot(false);
          }}
        />
      )}
      {selected && (
        <SpotSheet
          key={`sheet-${selected.id}`}
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
          key={`claim-${claiming.id}`}
          spot={claiming}
          holdings={holdings}
          player={player.name}
          setPlayer={player.setName}
          thresholds={thresholds}
          onClose={() => {
            setClaiming(null);
            refresh(); // a claim abandoned while saving may still have landed
          }}
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
  addSpot: {
    position: 'absolute',
    top: 142,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 9,
    elevation: 4,
  },
  addSpotText: { color: theme.white, fontSize: 22, lineHeight: 22, fontWeight: '700' },
  addSpotLabel: { color: theme.white, fontWeight: '700' },
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
