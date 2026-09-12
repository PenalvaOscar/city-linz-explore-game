import { gateFailureLines, outcomeLabel } from './resultCopy';
import type { ClaimResult } from './evaluateClaim';
import { DEFAULT_THRESHOLDS } from './thresholds';

const allPass: ClaimResult = {
  pass: true,
  distanceM: 12,
  headingDiff: 5,
  gates: { distance: 'pass', accuracy: 'pass', heading: 'pass', dwell: 'pass' },
};
const reading = { position: { lat: 0, lng: 0 }, accuracyM: 15, heading: 30, dwellS: 10 };

describe('outcomeLabel', () => {
  it('reads Claimed when nobody held the spot', () => {
    expect(outcomeLabel(null, 'oscar')).toBe('Claimed');
  });
  it('reads Reclaimed when I held it', () => {
    expect(outcomeLabel('oscar', 'oscar')).toBe('Reclaimed');
  });
  it('names the previous owner on a steal', () => {
    expect(outcomeLabel('lena', 'oscar')).toBe('Stolen from lena');
  });
});

describe('gateFailureLines', () => {
  it('is empty when every gate passed', () => {
    expect(gateFailureLines(allPass, reading, DEFAULT_THRESHOLDS)).toEqual([]);
  });
  it('words a near miss on distance as nearly, with the numbers', () => {
    const r: ClaimResult = { ...allPass, pass: false, distanceM: 48.4, gates: { ...allPass.gates, distance: 'review' } };
    expect(gateFailureLines(r, reading, DEFAULT_THRESHOLDS)).toEqual(['Nearly: 48 m away, get within 40 m']);
  });
  it('words a wide miss on distance as the wrong place', () => {
    const r: ClaimResult = { ...allPass, pass: false, distanceM: 123, gates: { ...allPass.gates, distance: 'fail' } };
    expect(gateFailureLines(r, reading, DEFAULT_THRESHOLDS)).toEqual(['Wrong place: 123 m away, get within 40 m']);
  });
  it('words a near miss on heading as nearly', () => {
    const r: ClaimResult = { ...allPass, pass: false, headingDiff: 42.6, gates: { ...allPass.gates, heading: 'review' } };
    expect(gateFailureLines(r, reading, DEFAULT_THRESHOLDS)).toEqual(['Nearly: 43° off, face within 35°']);
  });
  it('words a wide miss on heading as the wrong way', () => {
    const r: ClaimResult = { ...allPass, pass: false, headingDiff: 95, gates: { ...allPass.gates, heading: 'fail' } };
    expect(gateFailureLines(r, reading, DEFAULT_THRESHOLDS)).toEqual(['Wrong way: 95° off, face within 35°']);
  });
  it('says so when the compass gave no reading', () => {
    const r: ClaimResult = { ...allPass, pass: false, headingDiff: null, gates: { ...allPass.gates, heading: 'fail' } };
    expect(gateFailureLines(r, { ...reading, heading: null }, DEFAULT_THRESHOLDS)).toEqual(['No compass reading, move your phone in a figure eight']);
  });
  it('reports the accuracy reading against the limit', () => {
    const r: ClaimResult = { ...allPass, pass: false, gates: { ...allPass.gates, accuracy: 'fail' } };
    expect(gateFailureLines(r, { ...reading, accuracyM: 85.2 }, DEFAULT_THRESHOLDS)).toEqual(['GPS accuracy 85 m, needs 60 m or better']);
  });
  it('reports the dwell against the minimum', () => {
    const r: ClaimResult = { ...allPass, pass: false, gates: { ...allPass.gates, dwell: 'fail' } };
    expect(gateFailureLines(r, { ...reading, dwellS: 6 }, { ...DEFAULT_THRESHOLDS, dwellMinS: 10 })).toEqual(['Stayed 6 s, stay at least 10 s']);
  });
  it('lists every non-passing gate, distance first', () => {
    const r: ClaimResult = {
      pass: false,
      distanceM: 200,
      headingDiff: 50,
      gates: { distance: 'fail', accuracy: 'fail', heading: 'review', dwell: 'pass' },
    };
    expect(gateFailureLines(r, { ...reading, accuracyM: 70 }, DEFAULT_THRESHOLDS)).toEqual([
      'Wrong place: 200 m away, get within 40 m',
      'GPS accuracy 70 m, needs 60 m or better',
      'Nearly: 50° off, face within 35°',
    ]);
  });
});
