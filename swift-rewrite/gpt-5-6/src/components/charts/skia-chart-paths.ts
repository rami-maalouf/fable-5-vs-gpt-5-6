import { Skia } from '@shopify/react-native-skia';

export interface ScreenPoint {
  x: number;
  y: number;
}

export function createCatmullRomPath(points: readonly ScreenPoint[]) {
  const builder = Skia.PathBuilder.Make();
  const first = points[0];
  if (!first) return builder.detach();
  builder.moveTo(first.x, first.y);
  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index - 1] ?? points[index];
    const current = points[index];
    const next = points[index + 1];
    const following = points[index + 2] ?? next;
    builder.cubicTo(
      current.x + (next.x - previous.x) / 6,
      current.y + (next.y - previous.y) / 6,
      next.x - (following.x - current.x) / 6,
      next.y - (following.y - current.y) / 6,
      next.x,
      next.y,
    );
  }
  return builder.detach();
}

export function createLinearAreaPath(points: readonly ScreenPoint[], baselineY: number) {
  const builder = Skia.PathBuilder.Make();
  const first = points[0];
  const last = points.at(-1);
  if (!first || !last) return builder.detach();
  builder.moveTo(first.x, baselineY);
  builder.lineTo(first.x, first.y);
  for (const point of points.slice(1)) {
    builder.lineTo(point.x, point.y);
  }
  builder.lineTo(last.x, baselineY);
  builder.close();
  return builder.detach();
}
