import { buildLeafletPage, parseMapMessage, type MapPin } from './leafletPage';

const pins: MapPin[] = [
  { id: 'lentos', lat: 48.30962, lng: 14.28445, color: '#9E9E9E' },
  { id: 'ars', lat: 48.3005623, lng: 14.28674828, color: '#7B1FA2' },
];
const bounds: [[number, number], [number, number]] = [
  [48.29, 14.26],
  [48.31, 14.3],
];

describe('buildLeafletPage', () => {
  const html = buildLeafletPage({ pins, bounds, playerColor: '#1E3FAE' });

  it('embeds every pin with its resolved colour', () => {
    for (const p of pins) {
      expect(html).toContain(`"id":"${p.id}"`);
      expect(html).toContain(`"color":"${p.color}"`);
    }
  });
  it('fits the initial bounds', () => {
    expect(html).toContain('[[48.29,14.26],[48.31,14.3]]');
  });
  it('uses OpenStreetMap tiles without browser geolocation', () => {
    expect(html).toContain('tile.openstreetmap.org');
    expect(html).not.toContain('navigator.geolocation');
  });
  it('pins the Leaflet assets with subresource integrity', () => {
    expect(html).toContain('integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="');
    expect(html).toContain('integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="');
  });
  it('posts ready once the page API exists', () => {
    expect(html.indexOf('window.setPins = ')).toBeLessThan(html.indexOf("type: 'ready'"));
  });
  it('does not break out of the script tag when a pin id contains one', () => {
    const evil = buildLeafletPage({
      pins: [{ id: '</script><script>alert(1)', lat: 0, lng: 0, color: '#000' }],
      bounds,
      playerColor: '#000',
    });
    expect(evil).not.toContain('</script><script>alert(1)');
  });
});

describe('parseMapMessage', () => {
  it('parses a pin tap', () => {
    expect(parseMapMessage('{"type":"select","id":"lentos"}')).toEqual({ type: 'select', id: 'lentos' });
  });
  it('parses a map tap', () => {
    expect(parseMapMessage('{"type":"deselect"}')).toEqual({ type: 'deselect' });
  });
  it('parses ready and error signals', () => {
    expect(parseMapMessage('{"type":"ready"}')).toEqual({ type: 'ready' });
    expect(parseMapMessage('{"type":"error","message":"L is not defined"}')).toEqual({
      type: 'error',
      message: 'L is not defined',
    });
    expect(parseMapMessage('{"type":"error"}')).toBeNull();
  });
  it('ignores malformed or unknown payloads', () => {
    expect(parseMapMessage('not json')).toBeNull();
    expect(parseMapMessage('{"type":"select"}')).toBeNull();
    expect(parseMapMessage('{"type":"zoom"}')).toBeNull();
    expect(parseMapMessage('42')).toBeNull();
  });
});
