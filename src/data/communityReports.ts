import type { Agency, GeoPoint, HazardType, ReportStatus, RiskLevel, Severity } from '@/types/report';
import { HAZARDS } from '@/types/report';

export interface CommunityHazard {
  id: string;
  hazardType: HazardType;
  title: string;
  description: string;
  location: GeoPoint;
  address: string;
  county: string;
  riskLevel: RiskLevel;
  status: ReportStatus;
  trackingNumber: string;
  agency: Agency;
  severity: Severity;
  reportedAgo: string;
  upvotes: number;
  hotspotCorridor?: string;
}

export interface HazardHotspot {
  id: string;
  name: string;
  corridor: string;
  location: GeoPoint;
  incidentCount: number;
  primaryHazard: HazardType;
  riskLevel: RiskLevel;
  description: string;
}

/** Assess risk level (low, medium, high) based on hazard type and severity. */
export function calculateHazardRisk(hazardType: HazardType, severity: Severity = 'medium'): RiskLevel {
  const meta = HAZARDS[hazardType];
  if (meta?.urgent || hazardType === 'accident' || hazardType === 'power_line') {
    return 'high';
  }
  if (severity === 'large' || hazardType === 'flooding') {
    return 'high';
  }
  if (
    severity === 'small' &&
    (hazardType === 'sidewalk' || hazardType === 'sign' || hazardType === 'debris' || hazardType === 'dead_animal')
  ) {
    return 'low';
  }
  return 'medium';
}

/** Generate a realistic civic tracking ticket number. */
export function generateTrackingNumber(agency: Agency, hazardType: HazardType): string {
  const prefix =
    agency === 'modot' ? 'MODOT' : agency === 'stlouis_city' ? 'STL-CSB' : agency === 'stlouis_county' ? 'SLC-PW' : 'HAZ';
  const num = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${num}`;
}

/** Get next lifecycle status. */
export function getNextReportStatus(current: ReportStatus): ReportStatus {
  switch (current) {
    case 'draft':
    case 'handed_off':
    case 'submitted':
      return 'verified';
    case 'verified':
      return 'agency_notified';
    case 'agency_notified':
      return 'in_progress';
    case 'in_progress':
      return 'resolved';
    case 'resolved':
      return 'resolved';
    default:
      return 'submitted';
  }
}

/** Live St. Louis Community Hazard Reports. */
export const COMMUNITY_HAZARDS: CommunityHazard[] = [
  {
    id: 'comm_1',
    hazardType: 'pothole',
    title: 'Severe Rim-Bending Pothole',
    description: 'Deep pothole in right travel lane near park entrance. Multiple tire punctures reported.',
    location: { latitude: 38.6368, longitude: -90.2642 },
    address: 'S Kingshighway Blvd & Oakland Ave, St. Louis, MO',
    county: 'St. Louis City',
    riskLevel: 'high',
    status: 'in_progress',
    trackingNumber: 'STL-CSB-84192',
    agency: 'stlouis_city',
    severity: 'large',
    reportedAgo: '2h ago',
    upvotes: 28,
    hotspotCorridor: 'Kingshighway Arterial',
  },
  {
    id: 'comm_2',
    hazardType: 'accident',
    title: 'Multi-Vehicle Collision Clearing',
    description: 'Debris scattered across 2 westbound lanes. Emergency vehicles on shoulder.',
    location: { latitude: 38.6254, longitude: -90.2872 },
    address: 'I-64 / US-40 W near Hampton Ave, St. Louis, MO',
    county: 'St. Louis City',
    riskLevel: 'high',
    status: 'agency_notified',
    trackingNumber: 'MODOT-91402',
    agency: 'modot',
    severity: 'large',
    reportedAgo: '35m ago',
    upvotes: 45,
    hotspotCorridor: 'I-64 Hampton Interchange',
  },
  {
    id: 'comm_3',
    hazardType: 'flooding',
    title: 'Roadway Water Accumulation',
    description: 'Runoff pooling over both northbound lanes following storm. Impassable for sedans.',
    location: { latitude: 38.5632, longitude: -90.2845 },
    address: 'River des Peres Blvd & Gravois Rd, St. Louis, MO',
    county: 'St. Louis City',
    riskLevel: 'high',
    status: 'verified',
    trackingNumber: 'STL-CSB-83950',
    agency: 'stlouis_city',
    severity: 'large',
    reportedAgo: '3h ago',
    upvotes: 19,
    hotspotCorridor: 'River des Peres Basin',
  },
  {
    id: 'comm_4',
    hazardType: 'tree',
    title: 'Downed Oak Tree Limb in Lane',
    description: 'Large limb blocking right lane and bicycle corridor heading east toward CWE.',
    location: { latitude: 38.6481, longitude: -90.2587 },
    address: 'Lindell Blvd & N Euclid Ave, St. Louis, MO',
    county: 'St. Louis City',
    riskLevel: 'medium',
    status: 'verified',
    trackingNumber: 'STL-CSB-84011',
    agency: 'stlouis_city',
    severity: 'medium',
    reportedAgo: '4h ago',
    upvotes: 14,
  },
  {
    id: 'comm_5',
    hazardType: 'signal',
    title: 'Traffic Signal Flashing Red All Ways',
    description: 'Main intersection signals dark / flashing erratic red. Heavy cross traffic backup.',
    location: { latitude: 38.6412, longitude: -90.2319 },
    address: 'N Grand Blvd & Olive St, St. Louis, MO',
    county: 'St. Louis City',
    riskLevel: 'high',
    status: 'agency_notified',
    trackingNumber: 'STL-CSB-84220',
    agency: 'stlouis_city',
    severity: 'large',
    reportedAgo: '1h ago',
    upvotes: 32,
    hotspotCorridor: 'Grand Blvd Midtown Corridor',
  },
  {
    id: 'comm_6',
    hazardType: 'pothole',
    title: 'Asphalt Pavement Depression',
    description: 'Rough crater cluster on outside lane near dessert stand.',
    location: { latitude: 38.5912, longitude: -90.3065 },
    address: '6720 Chippewa St, St. Louis, MO',
    county: 'St. Louis City',
    riskLevel: 'medium',
    status: 'submitted',
    trackingNumber: 'STL-CSB-84310',
    agency: 'stlouis_city',
    severity: 'medium',
    reportedAgo: '6h ago',
    upvotes: 8,
  },
  {
    id: 'comm_7',
    hazardType: 'debris',
    title: 'Shredded Semi Truck Tire Tread',
    description: 'Large commercial tire gator in center lane causing sudden lane shifts.',
    location: { latitude: 38.6948, longitude: -90.4328 },
    address: 'I-270 N at Page Ave, St. Louis County, MO',
    county: 'St. Louis County',
    riskLevel: 'medium',
    status: 'resolved',
    trackingNumber: 'MODOT-90875',
    agency: 'modot',
    severity: 'medium',
    reportedAgo: '1d ago',
    upvotes: 11,
  },
  {
    id: 'comm_8',
    hazardType: 'sidewalk',
    title: 'Severely Buckled Tree-Root Sidewalk',
    description: 'Sidewalk concrete heaved 4 inches, wheelchair impassable.',
    location: { latitude: 38.6534, longitude: -90.2874 },
    address: 'Delmar Blvd & DeBaliviere Ave, St. Louis, MO',
    county: 'St. Louis City',
    riskLevel: 'low',
    status: 'resolved',
    trackingNumber: 'STL-CSB-82190',
    agency: 'stlouis_city',
    severity: 'small',
    reportedAgo: '2d ago',
    upvotes: 6,
  },
  {
    id: 'comm_9',
    hazardType: 'sign',
    title: 'Downed Stop Sign at Blind Corner',
    description: 'Post sheared at base, stop sign lying flat on grass.',
    location: { latitude: 38.6145, longitude: -90.3291 },
    address: 'Manchester Rd & S Hanley Rd, Brentwood, MO',
    county: 'St. Louis County',
    riskLevel: 'low',
    status: 'in_progress',
    trackingNumber: 'SLC-PW-41908',
    agency: 'stlouis_county',
    severity: 'small',
    reportedAgo: '8h ago',
    upvotes: 15,
  },
  {
    id: 'comm_10',
    hazardType: 'power_line',
    title: 'Low Hanging Wire Across Road',
    description: 'Storm knocked line down to 8ft height across residential street. 911 notified.',
    location: { latitude: 38.6019, longitude: -90.2541 },
    address: 'Arsenal St & S Grand Blvd, St. Louis, MO',
    county: 'St. Louis City',
    riskLevel: 'high',
    status: 'in_progress',
    trackingNumber: 'STL-CSB-84115',
    agency: 'stlouis_city',
    severity: 'large',
    reportedAgo: '1h ago',
    upvotes: 39,
  },
  {
    id: 'comm_11',
    hazardType: 'dead_animal',
    title: 'Wildlife Hazard: Deer Collision Ahead',
    description: 'White-tailed deer collision reported in center westbound travel lane. Caution advised.',
    location: { latitude: 38.6295, longitude: -90.312 },
    address: 'I-64 / US-40 near McKnight Rd, St. Louis County, MO',
    county: 'St. Louis County',
    riskLevel: 'high',
    status: 'agency_notified',
    trackingNumber: 'MODOT-91842',
    agency: 'modot',
    severity: 'large',
    reportedAgo: '18m ago',
    upvotes: 42,
    hotspotCorridor: 'I-64 West County Deer Crossing',
  },
];

export interface RouteHazardAlert {
  id: string;
  routeName: string;
  origin: string;
  destination: string;
  distanceMiles: number;
  hazardsAhead: {
    hazard: CommunityHazard;
    distanceMilesAhead: number;
    warningText: string;
  }[];
  recommendedDetour: string;
  status: 'critical_hazard' | 'moderate_hazard' | 'clear';
}

export const SAMPLE_ROUTES: RouteHazardAlert[] = [
  {
    id: 'route_school',
    routeName: 'Home ➔ High School Commute',
    origin: 'Ladue / Clayton',
    destination: 'West County / Parkway High',
    distanceMiles: 7.8,
    status: 'critical_hazard',
    hazardsAhead: [
      {
        hazard: {
          id: 'comm_11',
          hazardType: 'dead_animal',
          title: 'Wildlife Hazard: Deer Collision Ahead',
          description: 'White-tailed deer collision reported in center westbound travel lane.',
          location: { latitude: 38.6295, longitude: -90.312 },
          address: 'I-64 / US-40 near McKnight Rd',
          county: 'St. Louis County',
          riskLevel: 'high',
          status: 'agency_notified',
          trackingNumber: 'MODOT-91842',
          agency: 'modot',
          severity: 'large',
          reportedAgo: '18m ago',
          upvotes: 42,
        },
        distanceMilesAhead: 0.8,
        warningText: 'Wildlife hazard reported 0.8 miles ahead on I-64 West.',
      },
      {
        hazard: {
          id: 'comm_1',
          hazardType: 'pothole',
          title: 'Severe Rim-Bending Pothole',
          description: 'Deep pothole in right travel lane.',
          location: { latitude: 38.6368, longitude: -90.2642 },
          address: 'S Kingshighway Blvd near Oakland',
          county: 'St. Louis City',
          riskLevel: 'high',
          status: 'in_progress',
          trackingNumber: 'STL-CSB-84192',
          agency: 'stlouis_city',
          severity: 'large',
          reportedAgo: '2h ago',
          upvotes: 28,
        },
        distanceMilesAhead: 2.1,
        warningText: 'Severe tire-strike pothole reported in right lane.',
      },
    ],
    recommendedDetour: 'Detour via Clayton Rd & Forest Park Pkwy (Clear · 0 Hazards)',
  },
  {
    id: 'route_work',
    routeName: 'Midtown ➔ Downtown Commute',
    origin: 'CWE / Grand Center',
    destination: 'Market St / Gateway Arch',
    distanceMiles: 4.5,
    status: 'critical_hazard',
    hazardsAhead: [
      {
        hazard: {
          id: 'comm_5',
          hazardType: 'signal',
          title: 'Traffic Signal Flashing Red All Ways',
          description: 'Main intersection signals dark / flashing erratic red.',
          location: { latitude: 38.6412, longitude: -90.2319 },
          address: 'N Grand Blvd & Olive St',
          county: 'St. Louis City',
          riskLevel: 'high',
          status: 'agency_notified',
          trackingNumber: 'STL-CSB-84220',
          agency: 'stlouis_city',
          severity: 'large',
          reportedAgo: '1h ago',
          upvotes: 32,
        },
        distanceMilesAhead: 1.2,
        warningText: 'Dark / erratic traffic signal causing major intersection delays.',
      },
    ],
    recommendedDetour: 'Detour via Pine St or Chouteau Ave (Clear · Normal Flow)',
  },
  {
    id: 'route_river',
    routeName: 'South City ➔ Highway 55',
    origin: 'Tower Grove South',
    destination: 'River des Peres Greenway / I-55',
    distanceMiles: 5.2,
    status: 'critical_hazard',
    hazardsAhead: [
      {
        hazard: {
          id: 'comm_3',
          hazardType: 'flooding',
          title: 'Roadway Water Accumulation',
          description: 'Runoff pooling over both northbound lanes following storm.',
          location: { latitude: 38.5632, longitude: -90.2845 },
          address: 'River des Peres Blvd & Gravois Rd',
          county: 'St. Louis City',
          riskLevel: 'high',
          status: 'verified',
          trackingNumber: 'STL-CSB-83950',
          agency: 'stlouis_city',
          severity: 'large',
          reportedAgo: '3h ago',
          upvotes: 19,
        },
        distanceMilesAhead: 1.5,
        warningText: 'Street flooding over lanes. Roadway impassable for low-clearance sedans.',
      },
    ],
    recommendedDetour: 'Detour via Morgan Ford Rd & Chippewa St (Clear)',
  },
];

/** St. Louis Accident and Hazard Hotspot Zones. */
export const HAZARD_HOTSPOTS: HazardHotspot[] = [
  {
    id: 'spot_1',
    name: 'I-64 / Hampton Corridor',
    corridor: 'Interstate 64 MP 34-36',
    location: { latitude: 38.6254, longitude: -90.2872 },
    incidentCount: 16,
    primaryHazard: 'accident',
    riskLevel: 'high',
    description: 'High-speed merge zone with frequent lane closures and debris strikes.',
  },
  {
    id: 'spot_2',
    name: 'Kingshighway Blvd Corridor',
    corridor: 'S Kingshighway (I-44 to Forest Park)',
    location: { latitude: 38.6368, longitude: -90.2642 },
    incidentCount: 24,
    primaryHazard: 'pothole',
    riskLevel: 'high',
    description: 'Heavy bus and commercial freight traffic causing rapid freeze-thaw pavement potholes.',
  },
  {
    id: 'spot_3',
    name: 'River des Peres Basin',
    corridor: 'River des Peres Greenway & Morgan Ford',
    location: { latitude: 38.5632, longitude: -90.2845 },
    incidentCount: 11,
    primaryHazard: 'flooding',
    riskLevel: 'high',
    description: 'Low-lying watershed with recurring flash street flooding during rain events.',
  },
  {
    id: 'spot_4',
    name: 'Grand Blvd Midtown Corridor',
    corridor: 'Grand Blvd & Olive St / SLU',
    location: { latitude: 38.6412, longitude: -90.2319 },
    incidentCount: 13,
    primaryHazard: 'signal',
    riskLevel: 'medium',
    description: 'High-density urban transit intersection with frequent signal timing and pedestrian safety alerts.',
  },
];

