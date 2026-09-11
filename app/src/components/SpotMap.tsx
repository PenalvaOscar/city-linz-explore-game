import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import type { Spot } from '../data/types';
import { initialRegion } from '../verify/region';

// Single component wrapping react-native-maps so a later MapLibre swap stays contained (ADR-0001).
const PIN_FREE = '#9e9e9e';

export function SpotMap({ spots }: { spots: Spot[] }) {
  return (
    <MapView
      style={StyleSheet.absoluteFill}
      initialRegion={initialRegion(spots)}
      mapType={Platform.OS === 'ios' ? 'mutedStandard' : 'standard'}
    >
      {spots.map((s) => (
        <Marker
          key={s.id}
          coordinate={{ latitude: s.lat, longitude: s.lng }}
          title={s.name.en}
          pinColor={PIN_FREE}
        />
      ))}
    </MapView>
  );
}
