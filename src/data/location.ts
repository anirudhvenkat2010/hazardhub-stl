import * as Location from 'expo-location';

import type { GeoPoint } from '@/types/report';

export interface ResolvedLocation {
  point: GeoPoint;
  address?: string;
  city?: string;
  county?: string;
}

export type LocationResult =
  | { ok: true; value: ResolvedLocation }
  | { ok: false; reason: 'denied' | 'unavailable' };

/**
 * Request permission, get a GPS fix (with timeout + last-known fallback), and
 * reverse-geocode it to a street address + city + county — all on-device via
 * expo-location (no API key). County drives the agency routing + MoDOT form.
 */
export async function resolveCurrentLocation(): Promise<LocationResult> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return { ok: false, reason: 'denied' };

    const fresh = Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    const timeout = new Promise<never>((_, rej) =>
      setTimeout(() => rej(new Error('timeout')), 10000),
    );
    let pos: Location.LocationObject | null = null;
    try {
      pos = (await Promise.race([fresh, timeout])) as Location.LocationObject;
    } catch {
      pos = await Location.getLastKnownPositionAsync();
    }
    if (!pos) return { ok: false, reason: 'unavailable' };

    const point: GeoPoint = {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
    };

    // Reverse geocode (best-effort — may be empty on some platforms/web).
    let address: string | undefined;
    let city: string | undefined;
    let county: string | undefined;
    try {
      const places = await Location.reverseGeocodeAsync(point);
      const p = places[0];
      if (p) {
        city = p.city ?? p.subregion ?? undefined;
        county = p.subregion ?? undefined; // expo maps county -> subregion
        const parts = [
          p.streetNumber,
          p.street,
          p.city,
          p.region,
          p.postalCode,
        ].filter(Boolean);
        address = parts.join(' ').trim() || undefined;
      }
    } catch {
      // leave undefined; the UI shows coordinates and lets the user type a landmark
    }

    return { ok: true, value: { point, address, city, county } };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}
