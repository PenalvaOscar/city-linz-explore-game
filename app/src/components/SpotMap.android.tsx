import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import type { Holding, Spot } from '../data/types';
import type { LatLng } from '../verify/geo';
import { initialRegion, regionToBounds } from '../verify/region';
import { pinState } from '../verify/pinState';
import { pinColor, theme } from '../ui/theme';
import { buildLeafletPage, parseMapMessage, setPinsScript, type MapPin } from './leafletPage';

// Android fallback for Expo Go, where the embedded Google Maps key is rejected (issue #4):
// Leaflet + CARTO Positron tiles in a WebView, no API key. iOS keeps react-native-maps in SpotMap.tsx.
export const MAP_ATTRIBUTION = '© OpenStreetMap contributors · © CARTO';

type Props = {
  spots: Spot[];
  holdings: Holding[];
  /** The local player's display name; empty until one is stored. */
  player: string;
  showsUserLocation: boolean;
  position: LatLng | null;
  onSelect: (spot: Spot | null) => void;
};

export function SpotMap({ spots, holdings, player, showsUserLocation, position, onSelect }: Props) {
  const webview = useRef<WebView>(null);
  // Set by the page's own `ready` message, not onLoadEnd, so injected calls never race the inline script.
  const [ready, setReady] = useState(false);

  const pins: MapPin[] = useMemo(
    () =>
      spots.map((s) => ({
        id: s.id,
        lat: s.lat,
        lng: s.lng,
        color: pinColor[pinState(s, holdings, player)],
        heading: s.heading,
      })),
    [spots, holdings, player],
  );
  const playerPosition = showsUserLocation ? position : null;

  // The page is built once; later changes go over injectJavaScript so the map keeps its viewport.
  const [html] = useState(() =>
    buildLeafletPage({ pins, bounds: regionToBounds(initialRegion(spots)), playerColor: theme.primary }),
  );

  useEffect(() => {
    if (ready) webview.current?.injectJavaScript(setPinsScript(pins));
  }, [ready, pins]);

  useEffect(() => {
    if (ready) webview.current?.injectJavaScript(`window.setPlayer(${JSON.stringify(playerPosition)}); true;`);
  }, [ready, playerPosition]);

  return (
    <WebView
      ref={webview}
      style={StyleSheet.absoluteFill}
      source={{ html }}
      originWhitelist={['*']}
      onMessage={(e) => {
        const msg = parseMapMessage(e.nativeEvent.data);
        if (!msg) return;
        if (msg.type === 'ready') setReady(true);
        else if (msg.type === 'select') onSelect(spots.find((s) => s.id === msg.id) ?? null);
        else if (msg.type === 'deselect') onSelect(null);
        else console.warn(`SpotMap.android page error: ${msg.message}`);
      }}
      setSupportMultipleWindows={false}
      overScrollMode="never"
    />
  );
}
