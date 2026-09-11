import type { Bounds } from '../verify/region';

// Leaflet + OpenStreetMap page for the Android map (issue #4). Colours arrive resolved from
// pinState/pinColor; this file only draws what it is given.

export type MapPin = { id: string; lat: number; lng: number; color: string };

export type MapMessage = { type: 'select'; id: string } | { type: 'deselect' };

type PageInput = { pins: MapPin[]; bounds: Bounds; playerColor: string };

const LEAFLET_VERSION = '1.9.4';

/** JSON that is safe to inline inside a `<script>` block. */
const inlineJson = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c');

export function buildLeafletPage({ pins, bounds, playerColor }: PageInput): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js"></script>
<style>
  html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; background: #FAFAFC; }
  .pin { width: 26px; height: 36px; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var post = function (msg) { window.ReactNativeWebView.postMessage(JSON.stringify(msg)); };
  var map = L.map('map', { attributionControl: false, zoomControl: false });
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
  map.fitBounds(${inlineJson(bounds)});
  map.on('click', function () { post({ type: 'deselect' }); });

  var pinIcon = function (color) {
    return L.divIcon({
      className: '',
      iconSize: [26, 36],
      iconAnchor: [13, 36],
      html: '<svg class="pin" viewBox="0 0 26 36" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M13 0C5.8 0 0 5.8 0 13c0 9.5 13 23 13 23s13-13.5 13-23C26 5.8 20.2 0 13 0z" fill="' + color + '" stroke="#fff" stroke-width="1.5"/>' +
        '<circle cx="13" cy="13" r="4.5" fill="#fff"/></svg>'
    });
  };

  var markers = {};
  window.setPins = function (pins) {
    pins.forEach(function (p) {
      var m = markers[p.id];
      if (!m) {
        m = L.marker([p.lat, p.lng]).addTo(map);
        m.on('click', function () { post({ type: 'select', id: p.id }); });
        markers[p.id] = m;
      }
      m.setIcon(pinIcon(p.color));
    });
  };

  var player = null;
  window.setPlayer = function (pos) {
    if (!pos) { if (player) { map.removeLayer(player); player = null; } return; }
    if (!player) {
      player = L.circleMarker([pos.lat, pos.lng], {
        radius: 8, color: '#fff', weight: 2, fillColor: ${inlineJson(playerColor)}, fillOpacity: 1, interactive: false
      }).addTo(map);
    } else {
      player.setLatLng([pos.lat, pos.lng]);
    }
  };

  window.setPins(${inlineJson(pins)});
</script>
</body>
</html>`;
}

/** Decodes a message posted by the page; anything unexpected yields null. */
export function parseMapMessage(raw: string): MapMessage | null {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof data !== 'object' || data === null) return null;
  const msg = data as { type?: unknown; id?: unknown };
  if (msg.type === 'deselect') return { type: 'deselect' };
  if (msg.type === 'select' && typeof msg.id === 'string') return { type: 'select', id: msg.id };
  return null;
}
