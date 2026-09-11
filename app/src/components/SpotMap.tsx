import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import type { Holding, Spot } from '../data/types';
import { initialRegion } from '../verify/region';
import { NO_PLAYER, pinState } from '../verify/pinState';
import { pinColor } from '../ui/theme';

// Single component wrapping react-native-maps so a later MapLibre swap stays contained (ADR-0001).
export const MAP_PROVIDER = Platform.OS === 'ios' ? 'Apple Maps' : 'Google Maps';

type Props = {
  spots: Spot[];
  holdings: Holding[];
  showsUserLocation: boolean;
  onSelect: (spot: Spot | null) => void;
};

export function SpotMap({ spots, holdings, showsUserLocation, onSelect }: Props) {
  return (
    <MapView
      style={StyleSheet.absoluteFill}
      initialRegion={initialRegion(spots)}
      mapType={Platform.OS === 'ios' ? 'mutedStandard' : 'standard'}
      showsUserLocation={showsUserLocation}
      onPress={() => onSelect(null)}
    >
      {spots.map((s) => (
        <Marker
          key={s.id}
          coordinate={{ latitude: s.lat, longitude: s.lng }}
          pinColor={pinColor[pinState(s, holdings, NO_PLAYER)]}
          onPress={(e) => {
            e.stopPropagation();
            onSelect(s);
          }}
        />
      ))}
    </MapView>
  );
}
