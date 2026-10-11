import { getBucket, getArm, validateExperiment } from '../abBucketPreview';

describe('abBucketPreview', () => {
  test('locks shared vector to 86', () => {
    expect(getBucket('vip_for_new_10', 'vftE0NKr0C')).toBe(86);
  });
  test('range 0-99 and deterministic', () => {
    const a = getBucket('vip_for_new_10', 'alice');
    const b = getBucket('vip_for_new_10', 'alice');
    expect(a).toBe(b);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThan(100);
  });
  test('unicode and empty userId stay in range', () => {
    expect(getBucket('k', 'کاربر')).toBeGreaterThanOrEqual(0);
    expect(getBucket('k', '')).toBeLessThan(100);
  });
  test('getArm maps by traffic boundary', () => {
    const exp = { key: 'vip_for_new_10', traffic_pct: 87, control: 'control', variant: 'variant' };
    const r = getArm(exp, 'vftE0NKr0C');
    expect(r.bucket).toBe(86);
    expect(r.arm).toBe('variant');
    const r2 = getArm(
      { key: 'vip_for_new_10', traffic_pct: 10, control: 'control', variant: 'variant' },
      'vftE0NKr0C'
    );
    expect(r2.arm).toBe('control');
  });
  test('getArm supports arms array', () => {
    const exp = {
      key: 'vip_for_new_10',
      arms: [
        { name: 'control', pct: 50 },
        { name: 'variant', pct: 50 },
      ],
    };
    const r = getArm(exp, 'vftE0NKr0C');
    expect(r.bucket).toBe(86);
    expect(r.arm).toBe('variant');
  });
  test('validateExperiment flags G3 cases', () => {
    expect(validateExperiment({ key: '', traffic_pct: 10 })).toContain('Missing key');
    expect(validateExperiment({ key: 'a', traffic_pct: 'x' })).toContain('Traffic must be numeric');
    expect(validateExperiment({ key: 'a', traffic_pct: 200 })).toContain('Traffic must be 0-100');
    expect(validateExperiment({ key: 'a', traffic_pct: 10, start_iso: 'bad' })).toContain(
      'Invalid start date'
    );
    expect(validateExperiment({ key: 'a', traffic_pct: 10 })).toEqual([]);
  });
});
