import type { PotholeReport, Severity } from '@/types/report';
import { HAZARDS } from '@/types/report';
import { AGENCIES } from '@/data/agencies';

const SEVERITY_LABEL: Record<Severity, string> = {
  small: 'Small (minor, watch for it)',
  medium: 'Medium (clear hazard)',
  large: 'Large (serious / blown-tire risk)',
};

/** The hazard noun used in the report title + email subject. */
export function reportTitle(r: PotholeReport): string {
  return HAZARDS[r.hazardType ?? 'pothole'].reportNoun;
}

/**
 * Build the human-readable report text the user will submit. Designed to paste
 * straight into MoDOT's "Report a Road Concern" form or an email/phone call —
 * the app does the tedious capture work; the person taps one button to send.
 */
export function composeReportText(r: PotholeReport): string {
  const lines: string[] = [`${reportTitle(r)} report`];
  if (r.location) {
    lines.push(
      `Location: ${r.location.latitude.toFixed(6)}, ${r.location.longitude.toFixed(6)}`,
    );
  }
  if (r.address) lines.push(`Address: ${r.address}`);
  if (r.city) lines.push(`City: ${r.city}`);
  if (r.county) lines.push(`County: ${r.county}`);
  lines.push(`Severity: ${SEVERITY_LABEL[r.severity]}`);
  if (r.note) lines.push(`Details: ${r.note}`);
  if (r.photoUri) lines.push('(A photo was taken — attach it when prompted.)');
  lines.push('');
  lines.push(`Reported via HazardHub STL · ${new Date(r.createdAt).toLocaleString()}`);
  return lines.join('\n');
}

/** Google Maps link to the exact spot, for sharing / directions. */
export function mapsLink(r: PotholeReport): string | undefined {
  if (!r.location) return undefined;
  const { latitude, longitude } = r.location;
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

/** tel: URL for the routed agency. */
export function telLink(r: PotholeReport): string | undefined {
  const phone = AGENCIES[r.target]?.phone;
  return phone ? `tel:${phone}` : undefined;
}

/** mailto: URL with the report prefilled (agency email if known). */
export function mailtoLink(r: PotholeReport): string {
  const to = AGENCIES[r.target]?.email ?? '';
  const subject = encodeURIComponent(`${reportTitle(r)} report`);
  const body = encodeURIComponent(composeReportText(r));
  return `mailto:${to}?subject=${subject}&body=${body}`;
}

/** The agency's web form, if it has one. */
export function formLink(r: PotholeReport): string | undefined {
  return AGENCIES[r.target]?.formUrl;
}
