import type { Agency, AgencyTarget } from '@/types/report';

/**
 * Who to report a pothole to. Road ownership in the St. Louis area is split:
 *   • MoDOT — state highways & interstates (I-44/64/70/270, US/MO routes)
 *   • City of St. Louis — streets inside the City (Citizens' Service Bureau)
 *   • St. Louis County — county-maintained roads in the County
 *
 * We can't know the exact owner of a given street without a roads dataset, so
 * we route by city/county and show the user WHY, plus offer MoDOT as the
 * alternate for highways. Honest: this is best-effort routing, not authoritative.
 */

export const AGENCIES: Record<Agency, AgencyTarget> = {
  modot: {
    agency: 'modot',
    name: 'MoDOT (state highways)',
    formUrl: 'https://www.modot.org/report-road-concern',
    phone: '18882756636',
    phoneDisplay: '1-888-ASK-MODOT',
    covers: 'Interstates, US & MO highways (I-44/64/70/270, Route D, etc.)',
  },
  stlouis_city: {
    agency: 'stlouis_city',
    name: 'City of St. Louis — Citizens\u2019 Service Bureau',
    formUrl: 'https://www.stlouis-mo.gov/government/departments/street/street-division/potholes/report-a-pothole.cfm',
    phone: '3146224800',
    phoneDisplay: '(314) 622-4800',
    covers: 'City streets within the City of St. Louis',
  },
  stlouis_county: {
    agency: 'stlouis_county',
    name: 'St. Louis County — Transportation',
    phone: '3146157333',
    phoneDisplay: '(314) 615-7333',
    covers: 'County-maintained roads in St. Louis County',
  },
  unknown: {
    agency: 'unknown',
    name: 'Not sure — call 2-1-1 or MoDOT',
    phone: '18882756636',
    phoneDisplay: '1-888-ASK-MODOT',
    covers: 'If the road owner is unclear, MoDOT or 2-1-1 can redirect you',
  },
};

/**
 * Best-effort route from a resolved city/county to an agency.
 * Highways cut through every jurisdiction, so we always surface MoDOT as the
 * alternate in the UI; this just picks the DEFAULT local owner.
 */
export function routeAgency(county?: string, city?: string): Agency {
  const c = (city ?? '').toLowerCase();
  const co = (county ?? '').toLowerCase();
  if (c.includes('st. louis') || c.includes('saint louis') || c === 'st louis') {
    // The independent City of St. Louis is its own "county" in Census terms.
    if (co.includes('city')) return 'stlouis_city';
    // City of St. Louis proper
    if (c === 'st. louis' || c === 'saint louis' || c === 'st louis') return 'stlouis_city';
  }
  if (co.includes('st. louis') || co.includes('saint louis') || co.includes('st louis')) {
    return 'stlouis_county';
  }
  return 'unknown';
}
