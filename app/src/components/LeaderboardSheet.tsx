import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { prizeFor, seasonStatus } from '../data/season';
import type { Holding, Spot } from '../data/types';
import { formatRemaining } from '../verify/format';
import { boardRows, rankPlayers, type LeaderboardRow } from '../verify/leaderboard';
import { t } from '../ui/strings';
import { pinColor, theme } from '../ui/theme';

type Props = {
  /** Live holdings, the same decayed array the map consumes. */
  holdings: Holding[];
  holdingsAvailable: boolean;
  /** Spots the app knows, for naming a player's held spots; an unknown id is shown as is. */
  spots: Spot[];
  /** The local player's display name; empty until one is stored. */
  player: string;
  onClose: () => void;
};

export function LeaderboardSheet({ holdings, holdingsAvailable, spots, player, onClose }: Props) {
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
  const rows = useMemo(() => rankPlayers(holdings), [holdings]);
  const { top, own } = boardRows(rows, player);
  const spotNames = useMemo(() => new Map(spots.map((s) => [s.id, s.name.en])), [spots]);
  // Read once per open; the sheet is short-lived, so a ticking clock would only add churn.
  const [season] = useState(() => seasonStatus(new Date()));

  const renderRow = (row: LeaderboardRow) => {
    const mine = player !== '' && row.player === player;
    const expanded = expandedPlayer === row.player;
    const prize = prizeFor(row.rank);
    return (
      <View key={row.player}>
        <Pressable
          onPress={() => setExpandedPlayer(expanded ? null : row.player)}
          style={[styles.row, mine && styles.rowMine]}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
        >
          <Text style={[styles.rank, mine && styles.textMine]}>{row.rank}</Text>
          <View style={styles.playerColumn}>
            <Text style={[styles.player, mine && styles.textMine]} numberOfLines={1}>{row.player}</Text>
            {prize ? <Text style={styles.prize} numberOfLines={1}>{prize}</Text> : null}
          </View>
          <Text style={[styles.spots, mine && styles.textMine]}>
            {row.spots === 1 ? t('spotCountOne') : t('spotCountMany', { count: row.spots })}
          </Text>
          <Text style={[styles.points, mine && styles.textMine]}>{t('pointsHeld', { points: row.points })}</Text>
        </Pressable>
        {expanded
          ? holdings
              .filter((h) => h.player === row.player)
              .map((h) => (
                <View key={h.spot_id} style={styles.heldRow}>
                  <Text style={styles.heldName} numberOfLines={1}>{spotNames.get(h.spot_id) ?? h.spot_id}</Text>
                  <Text style={styles.heldPoints}>{t('pointsHeld', { points: h.points })}</Text>
                </View>
              ))
          : null}
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <Pressable onPress={onClose} style={styles.close} accessibilityLabel={t('close')} hitSlop={12}>
        <Text style={styles.closeText}>×</Text>
      </Pressable>
      <Text style={styles.title}>{t('leaderboard')}</Text>
      <Text style={styles.season}>
        {season.over ? t('seasonOver') : t('seasonEndsIn', { remaining: formatRemaining(season.remainingMs) })}
      </Text>
      {!holdingsAvailable ? (
        <Text style={styles.empty}>{t('leaderboardUnavailable')}</Text>
      ) : rows.length === 0 ? (
        <Text style={styles.empty}>{t('leaderboardEmpty')}</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {top.map(renderRow)}
          {own ? (
            <>
              <View style={styles.divider} />
              {renderRow(own)}
            </>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 56,
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
  title: { fontSize: 20, fontWeight: '700', color: theme.text, paddingRight: 28 },
  season: { color: theme.muted, fontSize: 13, marginTop: -6 },
  empty: { color: theme.muted, textAlign: 'center', paddingVertical: 24 },
  list: { gap: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
  },
  rowMine: { backgroundColor: theme.badgeOwnership },
  rank: { width: 28, fontWeight: '700', color: theme.muted, textAlign: 'right' },
  playerColumn: { flex: 1 },
  player: { fontWeight: '700', color: theme.text },
  prize: { color: theme.primary, fontSize: 12, fontWeight: '600' },
  spots: { color: theme.muted, fontSize: 13 },
  points: { fontWeight: '700', color: theme.text, minWidth: 56, textAlign: 'right' },
  textMine: { color: pinColor.mine },
  heldRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingLeft: 48, paddingRight: 10, paddingVertical: 6 },
  heldName: { flex: 1, color: theme.text },
  heldPoints: { color: theme.muted, fontSize: 13 },
  divider: { height: 1, backgroundColor: theme.border, marginVertical: 6 },
});
