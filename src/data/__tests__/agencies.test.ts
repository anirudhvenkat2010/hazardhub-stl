import { routeAgency, AGENCIES } from '../agencies';

describe('routeAgency', () => {
  it('routes City of St. Louis to the city CSB', () => {
    expect(routeAgency('St. Louis City', 'St. Louis')).toBe('stlouis_city');
    expect(routeAgency(undefined, 'Saint Louis')).toBe('stlouis_city');
  });
  it('routes St. Louis County to the county', () => {
    expect(routeAgency('St. Louis County', 'Kirkwood')).toBe('stlouis_county');
  });
  it('falls back to unknown for other areas', () => {
    expect(routeAgency('Franklin', 'Washington')).toBe('unknown');
  });
  it('every agency has a phone and a cover description', () => {
    for (const a of Object.values(AGENCIES)) {
      expect(a.phone).toBeTruthy();
      expect(a.covers).toBeTruthy();
      expect(a.name).toBeTruthy();
    }
  });
});
