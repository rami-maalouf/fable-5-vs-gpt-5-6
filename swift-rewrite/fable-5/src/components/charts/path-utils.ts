// catmull-rom -> cubic bezier conversion for skia paths, matching the look of
// swift charts' .interpolationMethod(.catmullRom)
import { Skia, type SkPath } from '@shopify/react-native-skia';

export interface XY {
  x: number;
  y: number;
}

export function catmullRomPath(points: readonly XY[]): SkPath {
  const builder = Skia.PathBuilder.Make();
  if (points.length === 0) return builder.build();
  builder.moveTo(points[0].x, points[0].y);
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    builder.cubicTo(c1x, c1y, c2x, c2y, p2.x, p2.y);
  }
  return builder.build();
}
