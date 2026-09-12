import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import type { Holding, Spot } from '../data/types';
import type { LatLng } from '../verify/geo';
import { headingGlyph } from '../verify/headingGlyph';
import { initialRegion } from '../verify/region';
import { pinState } from '../verify/pinState';
import { gemMarkerColor, pinColor, theme } from '../ui/theme';

// Single component wrapping react-native-maps so a later MapLibre swap stays contained (ADR-0001).
// Android resolves to SpotMap.android.tsx (Leaflet in a WebView, issue #4); this file serves iOS.
export const MAP_ATTRIBUTION = 'Map: Apple Maps';

type Props = {
  spots: Spot[];
  holdings: Holding[];
  /** The local player's display name; empty until one is stored. */
  player: string;
  showsUserLocation: boolean;
  /** Drawn by the Android page; native maps draw their own blue dot. */
  position: LatLng | null;
  /** The app clock's `now` at render, for the upcoming state of gem pins. */
  now: Date;
  onSelect: (spot: Spot | null) => void;
};

export function SpotMap({ spots, holdings, player, showsUserLocation, now, onSelect }: Props) {
  return (
    <MapView
      style={StyleSheet.absoluteFill}
      initialRegion={initialRegion(spots)}
      mapType="mutedStandard"
      showsUserLocation={showsUserLocation}
      onPress={() => onSelect(null)}
    >
      {spots.map((s) => (
        <Marker
          key={s.id}
          coordinate={{ latitude: s.lat, longitude: s.lng }}
          anchor={{ x: 0.5, y: 1 }}
          onPress={(e) => {
            e.stopPropagation();
            onSelect(s);
          }}
        >
          <Pin color={pinColor[pinState(s, holdings, player, now)]} heading={s.heading} gem={s.kind === 'gem'} />
        </Marker>
      ))}
    </MapView>
  );
}

// Same 26x36 teardrop as the Android page's SVG, built from views so no SVG dependency is needed:
// a white outline triangle, the circular head, the coloured tail over the head's border, then the
// white dot or, when the heading is known, the white arrow on top, and on a gem the diamond marker
// over the head's top-right rim.
function Pin({ color, heading, gem }: { color: string; heading: number | null; gem: boolean }) {
  const glyph = headingGlyph(heading);
  return (
    <View style={styles.pin}>
      <View style={styles.tailOutline} />
      <View style={[styles.head, { backgroundColor: color }]} />
      <View style={[styles.tail, { borderTopColor: color }]} />
      <View style={[styles.glyph, glyph && { transform: [{ rotate: `${glyph.rotation}deg` }] }]}>
        {glyph ? <View style={styles.arrow} /> : <View style={styles.dot} />}
      </View>
      {gem ? <View style={styles.gemMarker} /> : null}
    </View>
  );
}

// Border-drawn triangles whose sides run tangent to the head, so the outline reads as one teardrop;
// the coloured tail is inset 1.5 to leave the outline showing, like the SVG stroke on Android.
const triangle = { position: 'absolute', width: 0, height: 0, borderLeftColor: 'transparent', borderRightColor: 'transparent' } as const;

const styles = StyleSheet.create({
  pin: { width: 26, height: 36 },
  tailOutline: {
    ...triangle,
    top: 20.3,
    left: 2.3,
    borderLeftWidth: 10.7,
    borderRightWidth: 10.7,
    borderTopWidth: 15.7,
    borderTopColor: theme.white,
  },
  tail: { ...triangle, top: 19.5, left: 3.5, borderLeftWidth: 9.5, borderRightWidth: 9.5, borderTopWidth: 13.8 },
  head: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: theme.white },
  glyph: { position: 'absolute', top: 0, left: 0, width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: theme.white },
  // A 7x7 square turned 45° reads as the 10-wide diamond centred at (20, 6) on the Android page.
  gemMarker: {
    position: 'absolute',
    top: 2.5,
    left: 16.5,
    width: 7,
    height: 7,
    backgroundColor: gemMarkerColor,
    borderWidth: 1,
    borderColor: theme.white,
    transform: [{ rotate: '45deg' }],
  },
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 5.5,
    borderRightWidth: 5.5,
    borderBottomWidth: 11,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: theme.white,
  },
});
