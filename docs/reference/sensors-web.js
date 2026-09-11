/*
  sensors.js — GPS position + compass heading for the Zwergerl claim flow.

  Usage:
    import { startSensors, state, distanceM, bearingTo, headingDelta } from './sensors.js';

    // MUST be called from inside a click/tap handler (iOS requires it)
    button.onclick = async () => {
      const ok = await startSensors();
      if (!ok.heading) console.warn('no compass on this device');
    };

    // then read state.lat / state.lng / state.accuracy / state.heading any time,
    // or listen for updates:
    window.addEventListener('sensors', () => render());

  Requires HTTPS (localhost is fine for dev).
*/

export const state = {
  lat: null,
  lng: null,
  accuracy: null,     // metres — how much to trust lat/lng
  heading: null,      // degrees, 0 = north
  hasHeading: false,
  hasPosition: false
};

function emit() {
  window.dispatchEvent(new CustomEvent('sensors', { detail: state }));
}

// ---------- position ----------

let watchId = null;

function startPosition() {
  return new Promise(resolve => {
    if (!navigator.geolocation) return resolve(false);

    let settled = false;
    watchId = navigator.geolocation.watchPosition(
      pos => {
        state.lat = pos.coords.latitude;
        state.lng = pos.coords.longitude;
        state.accuracy = pos.coords.accuracy;
        state.hasPosition = true;
        emit();
        if (!settled) { settled = true; resolve(true); }
      },
      err => {
        console.warn('geolocation:', err.message);
        if (!settled) { settled = true; resolve(false); }
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 20000 }
    );
  });
}

export function stopPosition() {
  if (watchId !== null) navigator.geolocation.clearWatch(watchId);
  watchId = null;
}

// ---------- heading ----------

function onOrientation(e) {
  let deg = null;

  if (typeof e.webkitCompassHeading === 'number') {
    deg = e.webkitCompassHeading;                 // iOS: already true-ish north
  } else if (e.absolute && typeof e.alpha === 'number') {
    deg = 360 - e.alpha;                          // Android: alpha counts the other way
  }

  if (deg === null || Number.isNaN(deg)) return;

  state.heading = (deg + 360) % 360;
  state.hasHeading = true;
  emit();
}

async function startHeading() {
  const D = window.DeviceOrientationEvent;
  if (!D) return false;

  if (typeof D.requestPermission === 'function') {
    try {
      const res = await D.requestPermission();     // iOS 13+, needs a user gesture
      if (res !== 'granted') return false;
    } catch {
      return false;                                // thrown if not called from a gesture
    }
  }

  window.addEventListener('deviceorientationabsolute', onOrientation, true);
  window.addEventListener('deviceorientation', onOrientation, true);
  return true;
}

// ---------- public start ----------

export async function startSensors() {
  const heading = await startHeading();            // ask first — permission needs the gesture
  const position = await startPosition();
  return { heading, position };
}

// ---------- geometry ----------

const toRad = d => d * Math.PI / 180;
const toDeg = r => r * 180 / Math.PI;

/** Great-circle distance in metres. */
export function distanceM(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Compass bearing from point 1 to point 2, in degrees. */
export function bearingTo(lat1, lng1, lat2, lng2) {
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
            Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Smallest angle between two bearings. Handles the 350 vs 10 wrap. */
export function headingDelta(a, b) {
  return Math.abs(((a - b + 540) % 360) - 180);
}

// ---------- claim check ----------

/**
 * gem: { lat, lng, heading, radius }
 * Returns { pass, distance, delta, reason }
 */
export function checkClaim(gem, opts = {}) {
  const maxDist = opts.maxDist ?? gem.radius ?? 40;
  const maxDelta = opts.maxDelta ?? 35;
  const maxAccuracy = opts.maxAccuracy ?? 50;

  if (!state.hasPosition)
    return { pass: false, reason: 'Waiting for GPS' };

  if (state.accuracy > maxAccuracy)
    return { pass: false, reason: 'GPS signal too weak — wait a moment' };

  const distance = distanceM(state.lat, state.lng, gem.lat, gem.lng);
  if (distance > maxDist)
    return { pass: false, distance, reason: `${Math.round(distance)} m away — get closer` };

  if (gem.heading != null) {
    if (!state.hasHeading)
      return { pass: false, distance, reason: 'No compass on this device' };

    const delta = headingDelta(state.heading, gem.heading);
    if (delta > maxDelta)
      return { pass: false, distance, delta, reason: 'Turn — you are facing the wrong way' };

    return { pass: true, distance, delta, reason: 'Locked' };
  }

  return { pass: true, distance, reason: 'Locked' };
}
