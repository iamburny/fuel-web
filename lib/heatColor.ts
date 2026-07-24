/**
 * Diverging colour scale for price deviation from the national average:
 * cheaper-than-average → green, about-average → amber, pricier-than-average → red.
 * `delta` is pence vs the national mean; `maxAbs` is the pence deviation that saturates the scale.
 * Kept intentionally simple (three-stop RGB lerp) and mirrored by the Android HeatmapScreen so both
 * platforms colour the map the same way.
 */

const CHEAP: [number, number, number] = [22, 163, 74]; // #16a34a green
const MID: [number, number, number] = [234, 179, 8]; // #eab308 amber
const PRICEY: [number, number, number] = [220, 38, 38]; // #dc2626 red

function lerp(a: [number, number, number], b: [number, number, number], t: number): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

export function heatColor(delta: number, maxAbs: number): string {
  const span = Math.max(maxAbs, 0.1);
  const t = Math.max(-1, Math.min(1, delta / span));
  return t < 0 ? lerp(MID, CHEAP, -t) : lerp(MID, PRICEY, t);
}
