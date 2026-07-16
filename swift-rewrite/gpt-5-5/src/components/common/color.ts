import type { AlphaColorToken } from '@/theme';

export function rgba(hex: string, opacity = 1) {
  const normalized = hex.replace('#', '');
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

export function alphaColor({ hex, opacity }: AlphaColorToken) {
  return rgba(hex, opacity);
}
