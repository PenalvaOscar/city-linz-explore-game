#!/usr/bin/env node
// Generates ../data/gems.json from the festival export and the allowlist in ../data/gem-locations.csv:
// one gem per allowlisted location per festival day it has calendar slots. A row without a photo
// produces no gem. Re-run by hand after editing the allowlist or the export; the output is committed.
const fs = require('fs');
const path = require('path');

const exportFile = path.resolve(__dirname, '../../data/ars-electronica-notion-export.json');
const allowlistFile = path.resolve(__dirname, '../../data/gem-locations.csv');
const outFile = path.resolve(__dirname, '../../data/gems.json');

// The export only ever says MESZ; every window is written with this fixed offset.
const OFFSET = '+02:00';
const MONTHS = {
  Januar: 1, Februar: 2, März: 3, April: 4, Mai: 5, Juni: 6,
  Juli: 7, August: 8, September: 9, Oktober: 10, November: 11, Dezember: 12,
};
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function fail(message) {
  console.error(message);
  process.exit(1);
}

/** Minimal CSV reader: comma-separated, double-quoted fields may contain commas and "" escapes. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const [header, ...records] = rows;
  return records.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? '').trim()])));
}

const pad = (n) => String(n).padStart(2, '0');

/** "9. September 2026 15:15 (MESZ) → 16:15" or "… → 13. September 2026 1:00 (MESZ)" to local date and times. */
function parseSlotTime(text) {
  const full = /(\d{1,2})\. (\S+) (\d{4}) (\d{1,2}):(\d{2})/g;
  const [startMatch, endMatch] = [...text.matchAll(full)];
  if (!startMatch) return null;
  const toDate = (m) => ({ y: Number(m[3]), mo: MONTHS[m[2]], d: Number(m[1]), hh: Number(m[4]), mm: Number(m[5]) });
  const start = toDate(startMatch);
  let end;
  if (endMatch) {
    end = toDate(endMatch);
  } else {
    const m = /→ (\d{1,2}):(\d{2})/.exec(text);
    if (!m) return null;
    end = { ...start, hh: Number(m[1]), mm: Number(m[2]) };
  }
  if (!start.mo || !end.mo) return null;
  return { start, end };
}

const localDate = (t) => `${t.y}-${pad(t.mo)}-${pad(t.d)}`;
const localTime = (t) => `${pad(t.hh)}:${pad(t.mm)}`;
const iso = (t) => `${localDate(t)}T${localTime(t)}:00${OFFSET}`;
const minutes = (t) => t.hh * 60 + t.mm;
const weekday = (t) => WEEKDAYS[new Date(Date.UTC(t.y, t.mo - 1, t.d)).getUTCDay()];
const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const festival = JSON.parse(fs.readFileSync(exportFile, 'utf8'));
const locations = new Map(festival.locations.map((l) => [l.canonical_id, l]));
const projects = new Map(festival.projects.map((p) => [p.canonical_id, p]));
const slotsByLocation = new Map();
for (const slot of festival.calendar) {
  const m = /([0-9a-f]{32})/.exec(slot['Linked Location'] || '');
  if (!m) continue;
  if (!slotsByLocation.has(m[1])) slotsByLocation.set(m[1], []);
  slotsByLocation.get(m[1]).push(slot);
}

const gems = [];
for (const row of parseCsv(fs.readFileSync(allowlistFile, 'utf8'))) {
  const location = locations.get(row.location_id);
  if (!location) fail(`gem-locations.csv: location "${row.location_id}" is not in the export.`);
  if (!row.photo) continue;
  if (!Number.isFinite(Number(row.lat)) || !Number.isFinite(Number(row.lng)) || row.lat === '' || row.lng === '') {
    fail(`gem-locations.csv: location "${row.location_id}" needs numeric lat and lng.`);
  }
  const name = location['Name EN'];
  const byDate = new Map();
  for (const slot of slotsByLocation.get(row.location_id) || []) {
    const time = parseSlotTime(slot.Time);
    if (!time) fail(`Cannot parse time "${slot.Time}" of slot ${slot.canonical_id} at ${name}.`);
    if (localDate(time.start) !== localDate(time.end)) {
      fail(`Slot ${slot.canonical_id} at ${name} crosses midnight (${slot.Time}); windows are single-day.`);
    }
    const date = localDate(time.start);
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date).push({ slot, time });
  }
  for (const date of [...byDate.keys()].sort()) {
    const slots = byDate.get(date).sort(
      (a, b) => minutes(a.time.start) - minutes(b.time.start) || minutes(a.time.end) - minutes(b.time.end) || a.slot.canonical_id.localeCompare(b.slot.canonical_id),
    );
    const first = slots[0].time.start;
    const last = slots.reduce((acc, s) => (minutes(s.time.end) > minutes(acc) ? s.time.end : acc), slots[0].time.end);
    const highlighted = slots.some((s) => s.slot.Highlight === 'Yes');
    const featured = (highlighted ? slots.find((s) => s.slot.Highlight === 'Yes') : slots[0]).slot;
    const project = projects.get(featured.project_ref);
    const story = project
      ? [project['Name EN'], project['Web Preview Text EN']].filter(Boolean).join('\n\n')
      : '';
    gems.push({
      id: `gem-${slug(name)}-${pad(first.mo)}${pad(first.d)}`,
      name: { en: `${name} · ${weekday(first)} ${first.d}` },
      teaser: { en: row.teaser || `${weekday(first)} ${localTime(first)} to ${localTime(last)}` },
      story: { en: row.story || story },
      lat: Number(row.lat),
      lng: Number(row.lng),
      heading: row.heading === '' ? null : Number(row.heading),
      kind: 'gem',
      points: highlighted ? 50 : 30,
      photo: row.photo,
      window: { start: iso(first), end: iso(last), locationId: row.location_id },
    });
  }
}

fs.writeFileSync(outFile, JSON.stringify(gems, null, 2) + '\n');
console.log(`Wrote ${path.relative(process.cwd(), outFile)} with ${gems.length} gem(s).`);
