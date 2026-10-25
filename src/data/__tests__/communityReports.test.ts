import {
  calculateHazardRisk,
  generateTrackingNumber,
  getNextReportStatus,
  COMMUNITY_HAZARDS,
  HAZARD_HOTSPOTS,
} from '../communityReports';

describe('calculateHazardRisk', () => {
  it('correctly assesses high risk hazards', () => {
    expect(calculateHazardRisk('accident')).toBe('high');
    expect(calculateHazardRisk('power_line')).toBe('high');
    expect(calculateHazardRisk('flooding')).toBe('high');
    expect(calculateHazardRisk('pothole', 'large')).toBe('high');
  });

  it('correctly assesses medium risk hazards', () => {
    expect(calculateHazardRisk('pothole', 'medium')).toBe('medium');
    expect(calculateHazardRisk('tree', 'medium')).toBe('medium');
    expect(calculateHazardRisk('signal', 'medium')).toBe('medium');
  });

  it('correctly assesses low risk hazards', () => {
    expect(calculateHazardRisk('sidewalk', 'small')).toBe('low');
    expect(calculateHazardRisk('sign', 'small')).toBe('low');
    expect(calculateHazardRisk('debris', 'small')).toBe('low');
  });
});

describe('generateTrackingNumber', () => {
  it('generates properly formatted ticket IDs for each agency', () => {
    expect(generateTrackingNumber('stlouis_city', 'pothole')).toMatch(/^STL-CSB-\d{5}$/);
    expect(generateTrackingNumber('modot', 'accident')).toMatch(/^MODOT-\d{5}$/);
    expect(generateTrackingNumber('stlouis_county', 'tree')).toMatch(/^SLC-PW-\d{5}$/);
  });
});

describe('getNextReportStatus', () => {
  it('advances through civic status lifecycle in proper order', () => {
    expect(getNextReportStatus('submitted')).toBe('verified');
    expect(getNextReportStatus('verified')).toBe('agency_notified');
    expect(getNextReportStatus('agency_notified')).toBe('in_progress');
    expect(getNextReportStatus('in_progress')).toBe('resolved');
    expect(getNextReportStatus('resolved')).toBe('resolved');
  });
});

describe('Community Data Integrity', () => {
  it('contains valid community hazards with coordinates in St. Louis metro', () => {
    expect(COMMUNITY_HAZARDS.length).toBeGreaterThanOrEqual(8);
    for (const h of COMMUNITY_HAZARDS) {
      expect(h.location.latitude).toBeGreaterThan(38.4);
      expect(h.location.latitude).toBeLessThan(38.8);
      expect(h.location.longitude).toBeGreaterThan(-90.6);
      expect(h.location.longitude).toBeLessThan(-90.1);
      expect(['low', 'medium', 'high']).toContain(h.riskLevel);
      expect(h.trackingNumber).toBeTruthy();
    }
  });

  it('contains valid hazard hotspot zones', () => {
    expect(HAZARD_HOTSPOTS.length).toBeGreaterThanOrEqual(4);
    for (const spot of HAZARD_HOTSPOTS) {
      expect(spot.incidentCount).toBeGreaterThan(0);
      expect(spot.corridor).toBeTruthy();
    }
  });
});
