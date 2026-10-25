import { labelToHazardType } from '../hazardLabels';

describe('labelToHazardType', () => {
  it('maps common Teachable Machine labels to hazard types', () => {
    expect(labelToHazardType('Pothole')).toBe('pothole');
    expect(labelToHazardType('pot hole')).toBe('pothole');
    expect(labelToHazardType('Fallen Tree')).toBe('tree');
    expect(labelToHazardType('Flooded road')).toBe('flooding');
    expect(labelToHazardType('Traffic Light')).toBe('signal');
    expect(labelToHazardType('Car accident')).toBe('accident');
    expect(labelToHazardType('Downed power line')).toBe('power_line');
    expect(labelToHazardType('Dead deer')).toBe('dead_animal');
  });

  it('returns undefined for labels that do not match a hazard type', () => {
    expect(labelToHazardType('Background')).toBeUndefined();
    expect(labelToHazardType('Nothing')).toBeUndefined();
    expect(labelToHazardType('')).toBeUndefined();
  });
});
