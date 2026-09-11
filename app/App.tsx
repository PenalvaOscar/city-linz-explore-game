import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SpotMap } from './src/components/SpotMap';
import { spots } from './src/data/spots';

const MAP_PROVIDER = Platform.OS === 'ios' ? 'Apple Maps' : 'Google Maps';

export default function App() {
  return (
    <View style={styles.container}>
      <SpotMap spots={spots} />
      <View style={styles.attribution} pointerEvents="none">
        <Text style={styles.attributionText}>
          Data: Ars Electronica Festival 2026 · Stadt Linz (CC-BY) · Map: {MAP_PROVIDER}
        </Text>
      </View>
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  attribution: {
    position: 'absolute',
    bottom: 24,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  attributionText: { fontSize: 10, color: '#444' },
});
