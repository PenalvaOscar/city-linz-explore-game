import { newDeviceId } from './deviceId';

describe('newDeviceId', () => {
  it('is 32 lowercase hex characters', () => {
    expect(newDeviceId()).toMatch(/^[0-9a-f]{32}$/);
  });
  it('differs between calls', () => {
    expect(newDeviceId()).not.toBe(newDeviceId());
  });
});
