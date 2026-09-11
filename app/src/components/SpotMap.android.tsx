import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import type { Holding, Spot } from '../data/types';
import type { LatLng } from '../verify/geo';
import { initialRegion, regionToBounds } from '../verify/region';
import { NO_PLAYER, pinState } from '../verify/pinState';
import { pinColor, theme } from '../ui/theme';
import { buildLeafletPage, parseMapMessage, type MapPin } from './leafletPage';

// Android fallback for Expo Go, where the embedded Google Maps key is rejected (issue #4):
// Leaflet + OpenStreetMap in a WebView, no API key. iOS keeps react-native-maps in SpotMap.tsx.
export const MAP_ATTRIBUTION = '© OpenStreetMap contributors';

type Props = {
  spots: Spot[];
  holdings: Holding[];
  showsUserLocation: boolean;
  position: LatLng | null;
  onSelect: (spot: Spot | null) => void;
};

export function SpotMap({ spots, holdings, showsUserLocation, position, onSelect }: Props) {
  const webview = useRef<WebView>(null);
  const [loaded, setLoaded] = useState(false);

  const pins: MapPin[] = useMemo(
    () => spots.map((s) => ({ id: s.id, lat: s.lat, lng: s.lng, color: pinColor[pinState(s, holdings, NO_PLAYER)] })),
    [spots, holdings],
  );
  const player = showsUserLocation ? position : null;

  // The page is built once; later changes go over injectJavaScript so the map keeps its viewport.
  const [html] = useState(() =>
    buildLeafletPage({ pins, bounds: regionToBounds(initialRegion(spots)), playerColor: theme.primary }),
  );

  useEffect(() => {
    if (loaded) webview.current?.injectJavaScript(`window.setPins(${JSON.stringify(pins)}); true;`);
  }, [loaded, pins]);

  useEffect(() => {
    if (loaded) webview.current?.injectJavaScript(`window.setPlayer(${JSON.stringify(player)}); true;`);
  }, [loaded, player]);

  return (
    <WebView
      ref={webview}
      style={StyleSheet.absoluteFill}
      source={{ html }}
      originWhitelist={['*']}
      onLoadEnd={() => setLoaded(true)}
      onMessage={(e) => {
        const msg = parseMapMessage(e.nativeEvent.data);
        if (!msg) return;
        onSelect(msg.type === 'select' ? (spots.find((s) => s.id === msg.id) ?? null) : null);
      }}
      setSupportMultipleWindows={false}
      overScrollMode="never"
    />
  );
}
