import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ClaimFlow } from './src/components/claim/ClaimFlow';
import { MAP_ATTRIBUTION, SpotMap } from './src/components/SpotMap';
import { SpotSheet } from './src/components/SpotSheet';
import { AddSpotSheet } from './src/components/AddSpotSheet';
import { LeaderboardSheet } from './src/components/LeaderboardSheet';
import { spots } from './src/data/spots';
import { loadRemoteSpots } from './src/data/remoteSpots';
import { seasonStatus } from './src/data/season';
import type { Spot } from './src/data/types';
import { useHoldings } from './src/hooks/useHoldings';
import { usePlayer } from './src/hooks/usePlayer';
import { usePosition } from './src/hooks/usePosition';
import { createClock } from './src/verify/clock';
import { applyDecay } from './src/verify/decay';
import { DEFAULT_THRESHOLDS, RELAXED_THRESHOLDS } from './src/verify/thresholds';
import { windowState } from './src/verify/windowState';
import { t } from './src/ui/strings';
import { theme } from './src/ui/theme';

// Desk development only; see .env.example. Read once here so the verify module stays environment-free.
const thresholds = process.env.EXPO_PUBLIC_RELAXED_GATES ? RELAXED_THRESHOLDS : DEFAULT_THRESHOLDS;
// The only source of `now`: the wall clock, or the demo instant running from launch. No other module reads the wall clock.
const clock = createClock(process.env.EXPO_PUBLIC_DEMO_NOW, Date.now);

export default function App() {
  const [selected, setSelected] = useState<Spot | null>(null);
  const [claiming, setClaiming] = useState<Spot | null>(null);
  const [addingSpot, setAddingSpot] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [mapSpots, setMapSpots] = useState(spots);
  const { holdings: rawHoldings, available, refresh } = useHoldings();
  // Decay is applied once here, at the time of each holdings read; everything below sees only live holdings.
  const holdings = useMemo(() => applyDecay(rawHoldings, clock.now()), [rawHoldings]);
  const { granted, denied, position } = usePosition();
  const player = usePlayer();
  const me = player.name ?? '';
  const myPoints = holdings.filter((h) => h.player === me).reduce((sum, h) => sum + h.points, 0);
  const mySpots = holdings.filter((h) => h.player === me).length;

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
    if (selected || leaderboardOpen) refresh();
  }, [selected, leaderboardOpen, refresh]);

  const now = clock.now();
  // A closed gem leaves the map and the sheet; a held one still counts on the board, so the leaderboard keeps the full list for names.
  const visibleSpots = mapSpots.filter((spot) => windowState(spot, now) !== 'closed');
  const sheetSpot = selected !== null && windowState(selected, now) !== 'closed' ? selected : null;
  // Once the season is over, or while a gem is still upcoming, no claim handler is passed, the same path as a missing position,
  // so a late or early claim cannot move the board.
  const canClaim = position !== null && player.loaded && !seasonStatus(now).over;
  const canClaimSheet = canClaim && sheetSpot !== null && windowState(sheetSpot, now) === 'open';

  return (
    <View style={styles.container}>
      <SpotMap
        spots={visibleSpots}
        holdings={holdings}
        player={me}
        showsUserLocation={granted}
        position={position}
        now={now}
        onSelect={(spot) => { setLeaderboardOpen(false); setSelected(spot); }}
      />
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.brand}>
            <Text style={styles.wordmark}>{t('appName')}</Text>
            <Text style={styles.tagline}>{t('tagline')}</Text>
          </View>
          <Pressable
            onPress={() => { setSelected(null); setAddingSpot(false); setLeaderboardOpen(true); }}
            style={styles.streak}
            accessibilityRole="button"
            accessibilityLabel={t('leaderboard')}
          >
            <MaterialCommunityIcons name="fire" size={22} color={theme.primary} />
            <View>
              <Text style={styles.streakValue}>{myPoints} Pkt</Text>
              <Text style={styles.streakLabel}>{mySpots} Spots</Text>
            </View>
          </Pressable>
        </View>
      </View>
      <Pressable onPress={() => { setSelected(null); setAddingSpot(true); }} style={styles.addSpot}>
        <Ionicons name="add" size={20} color={theme.white} />
        <Text style={styles.addSpotLabel}>{t('addSpot')}</Text>
      </Pressable>
      <Pressable
        onPress={() => { setSelected(null); setAddingSpot(false); setLeaderboardOpen(true); }}
        style={styles.trophy}
        accessibilityRole="button"
        accessibilityLabel={t('leaderboard')}
      >
        <Ionicons name="trophy" size={26} color={theme.white} />
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
      {sheetSpot && (
        <SpotSheet
          key={`sheet-${sheetSpot.id}`}
          spot={sheetSpot}
          holdings={holdings}
          holdingsAvailable={available}
          position={position}
          player={me}
          onClaim={canClaimSheet ? () => setClaiming(sheetSpot) : null}
          locationDenied={denied}
          now={now}
          onClose={() => setSelected(null)}
        />
      )}
      {leaderboardOpen && (
        <LeaderboardSheet
          holdings={holdings}
          holdingsAvailable={available}
          spots={mapSpots}
          player={me}
          now={now}
          onClose={() => setLeaderboardOpen(false)}
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
    top: 52,
    left: 12,
    right: 12,
    backgroundColor: theme.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  brand: { flex: 1 },
  wordmark: { color: theme.primary, fontWeight: '900', fontSize: 26, letterSpacing: 1 },
  tagline: { color: theme.primary, fontSize: 13, marginTop: 1, fontWeight: '600' },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.accentYellow,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  streakValue: { color: theme.primary, fontWeight: '800', fontSize: 14, lineHeight: 16 },
  streakLabel: { color: theme.primary, fontSize: 11, lineHeight: 13 },
  addSpot: {
    position: 'absolute',
    top: 130,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.primary,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  addSpotLabel: { color: theme.white, fontWeight: '700' },
  trophy: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.accentPink,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: theme.accentPink,
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
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
