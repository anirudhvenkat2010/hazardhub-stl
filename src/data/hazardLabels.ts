import type { HazardType } from '@/types/report';

/**
 * Map a Teachable Machine class label to one of the app's hazard types.
 * Pure function (no native imports) so it is unit-testable in Jest.
 */
export function labelToHazardType(label: string): HazardType | undefined {
  const l = label.toLowerCase().trim();
  const table: Array<[RegExp, HazardType]> = [
    [/pot ?hole/, 'pothole'],
    [/tree|limb|branch/, 'tree'],
    [/flood|water/, 'flooding'],
    [/animal|deer|roadkill|carcass/, 'dead_animal'],
    [/signal|traffic light|stop ?light/, 'signal'],
    [/sign/, 'sign'],
    [/debris|object|trash/, 'debris'],
    [/sidewalk|curb/, 'sidewalk'],
    [/storm|ice|snow/, 'storm'],
    [/accident|crash|collision/, 'accident'],
    [/disabled|stalled|broken.?down/, 'disabled_vehicle'],
    [/closure|closed|blocked/, 'road_closure'],
    [/power ?line|wire|electric/, 'power_line'],
  ];
  for (const [re, type] of table) if (re.test(l)) return type;
  return undefined;
}
