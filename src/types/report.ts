/** Core types for HazardHub — capture + route a road-hazard report. */

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

/** Which agency owns the road at a location (best-effort guess). */
export type Agency = 'modot' | 'stlouis_city' | 'stlouis_county' | 'unknown';

export interface AgencyTarget {
  agency: Agency;
  name: string;
  /** Web form to report a concern, if any. */
  formUrl?: string;
  /** Phone number (digits only for tel:), display form in `phoneDisplay`. */
  phone?: string;
  phoneDisplay?: string;
  /** Reporting email, if the agency takes emailed reports. */
  email?: string;
  /** Short note on what this agency covers. */
  covers: string;
}

export type Severity = 'small' | 'medium' | 'large';

/** Kinds of road hazard this app can report. All route to the same agencies. */
export type HazardType =
  | 'pothole'
  | 'tree'
  | 'flooding'
  | 'dead_animal'
  | 'signal'
  | 'sign'
  | 'debris'
  | 'power_line'
  | 'sidewalk'
  | 'storm'
  | 'accident'
  | 'disabled_vehicle'
  | 'road_closure'
  | 'other';

export interface HazardMeta {
  type: HazardType;
  /** Short label for the picker. */
  label: string;
  emoji: string;
  /** Noun used in the composed report title / subject, e.g. "Downed tree". */
  reportNoun: string;
  /** Placeholder detail prompt tuned to this hazard. */
  detailHint: string;
  /** Grouping for the picker: an immediate-danger incident vs. a maintenance hazard. */
  group: 'hazard' | 'incident';
  /** Life-safety hazards that should prompt the user to call 911 first. */
  urgent?: boolean;
  /** Short note shown under the picker when this type is selected (honest routing guidance). */
  routeHint?: string;
}

export const HAZARDS: Record<HazardType, HazardMeta> = {
  pothole: {
    type: 'pothole',
    label: 'Pothole',
    emoji: '\ud83d\udd73\ufe0f',
    reportNoun: 'Pothole',
    detailHint: 'Nearest intersection, lane, size\u2026',
    group: 'hazard',
  },
  tree: {
    type: 'tree',
    label: 'Tree / limb',
    emoji: '\ud83c\udf33',
    reportNoun: 'Fallen tree or limb in the roadway',
    detailHint: 'Is it blocking a lane? Which direction?',
    group: 'hazard',
  },
  flooding: {
    type: 'flooding',
    label: 'Flooding',
    emoji: '\ud83c\udf0a',
    reportNoun: 'Water / flooding over the roadway',
    detailHint: 'How deep? Is the road impassable?',
    group: 'hazard',
  },
  dead_animal: {
    type: 'dead_animal',
    label: 'Dead animal',
    emoji: '\ud83e\udd8c',
    reportNoun: 'Dead animal in or beside the roadway',
    detailHint: 'Which lane / shoulder? Large animal (deer)?',
    group: 'hazard',
  },
  signal: {
    type: 'signal',
    label: 'Signal / light',
    emoji: '\ud83d\udea6',
    reportNoun: 'Traffic signal or street light failure',
    detailHint: 'Signal dark? Flashing? Light out?',
    group: 'hazard',
  },
  sign: {
    type: 'sign',
    label: 'Sign down',
    emoji: '\ud83e\udea7',
    reportNoun: 'Damaged, missing, or knocked-down sign',
    detailHint: 'Stop sign? Which direction / intersection?',
    group: 'hazard',
  },
  debris: {
    type: 'debris',
    label: 'Debris',
    emoji: '\ud83e\uddf1',
    reportNoun: 'Debris / object in the roadway',
    detailHint: 'What is it? Blocking a lane?',
    group: 'hazard',
  },
  sidewalk: {
    type: 'sidewalk',
    label: 'Sidewalk',
    emoji: '\ud83e\uddcd',
    reportNoun: 'Damaged or blocked sidewalk',
    detailHint: 'Cracked, heaved, blocked? Accessibility issue?',
    group: 'hazard',
  },
  storm: {
    type: 'storm',
    label: 'Storm / ice',
    emoji: '\u26c8\ufe0f',
    reportNoun: 'Storm or ice hazard on the roadway',
    detailHint: 'Ice, snow, flooding, wind damage?',
    group: 'hazard',
  },
  power_line: {
    type: 'power_line',
    label: 'Power line',
    emoji: '\u26a1',
    reportNoun: 'Downed power line',
    detailHint: 'Stay well back. Is it sparking / across the road?',
    group: 'incident',
    urgent: true,
    routeHint: 'A downed power line is dangerous \u2014 call 911 first, then the utility. Do not go near it.',
  },
  accident: {
    type: 'accident',
    label: 'Accident',
    emoji: '\ud83d\ude98',
    reportNoun: 'Traffic accident',
    detailHint: 'Injuries? Lanes blocked? How many vehicles?',
    group: 'incident',
    urgent: true,
    routeHint: 'If anyone is hurt or lanes are blocked, call 911 first. This app does not dispatch help.',
  },
  disabled_vehicle: {
    type: 'disabled_vehicle',
    label: 'Disabled vehicle',
    emoji: '\ud83d\ude97',
    reportNoun: 'Disabled vehicle on the roadway',
    detailHint: 'Blocking a lane or on the shoulder? Hazards on?',
    group: 'incident',
  },
  road_closure: {
    type: 'road_closure',
    label: 'Road closure',
    emoji: '\ud83d\udeab',
    reportNoun: 'Road closure or blockage',
    detailHint: 'What\u2019s blocking it? Full or partial closure?',
    group: 'incident',
  },
  other: {
    type: 'other',
    label: 'Other',
    emoji: '\u26a0\ufe0f',
    reportNoun: 'Road hazard',
    detailHint: 'Describe the hazard and exact spot…',
    group: 'hazard',
  },
};

/** Official lifecycle status of a hazard report. */
export type ReportStatus =
  | 'submitted'
  | 'verified'
  | 'agency_notified'
  | 'in_progress'
  | 'resolved'
  | 'draft'
  | 'handed_off';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface StatusStepMeta {
  key: ReportStatus;
  label: string;
  icon: string;
  description: string;
  color: string;
}

export const REPORT_STATUS_STEPS: StatusStepMeta[] = [
  {
    key: 'submitted',
    label: 'Submitted',
    icon: 'paper-plane',
    description: 'Report filed with photo & coordinates',
    color: '#F2C94C',
  },
  {
    key: 'verified',
    label: 'Verified',
    icon: 'shield-checkmark',
    description: 'AI vision & community verified',
    color: '#F2A33C',
  },
  {
    key: 'agency_notified',
    label: 'Agency Notified',
    icon: 'business',
    description: 'Work order ticket dispatched',
    color: '#56CCF2',
  },
  {
    key: 'in_progress',
    label: 'In Progress',
    icon: 'construct',
    description: 'Municipal repair crew assigned',
    color: '#BB6BD9',
  },
  {
    key: 'resolved',
    label: 'Resolved',
    icon: 'checkmark-circle',
    description: 'Hazard repaired & road safe',
    color: '#27AE60',
  },
];

export interface PotholeReport {
  id: string;
  createdAt: number;
  /** What kind of hazard this is. Defaults to pothole for older saved reports. */
  hazardType?: HazardType;
  /** Local file URI of the captured/selected photo, if any. */
  photoUri?: string;
  location: GeoPoint | null;
  /** Human address resolved from GPS, if available. */
  address?: string;
  /** County resolved from GPS (drives agency routing + the MoDOT form field). */
  county?: string;
  city?: string;
  severity: Severity;
  /** Free-text note / landmark the user adds. */
  note?: string;
  /** Agency this report was routed to. */
  target: Agency;
  /** Municipal lifecycle status of this report. */
  status: ReportStatus;
  /** Official municipal tracking reference number, e.g. STL-CSB-84920. */
  trackingNumber?: string;
  /** Evaluated risk level (low, medium, high). */
  riskLevel?: RiskLevel;
  /** Timestamp when status last advanced. */
  statusUpdatedAt?: number;
}

