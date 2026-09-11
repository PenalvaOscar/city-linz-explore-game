// Native map modules have no JS implementation under jest; only the exported constants are under test.
jest.mock('react-native-maps', () => ({}));
jest.mock('react-native-webview', () => ({}));
import { MAP_ATTRIBUTION as iosAttribution } from './SpotMap';
import { MAP_ATTRIBUTION as androidAttribution } from './SpotMap.android';

describe('MAP_ATTRIBUTION', () => {
  it('credits OpenStreetMap and CARTO on Android', () => {
    expect(androidAttribution).toContain('© OpenStreetMap contributors');
    expect(androidAttribution).toContain('© CARTO');
  });
  it('credits Apple Maps on iOS', () => {
    expect(iosAttribution).toBe('Map: Apple Maps');
  });
});
