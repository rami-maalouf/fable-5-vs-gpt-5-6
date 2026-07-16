export function toLikePattern(value: string) {
  const escaped = value.trim().replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');
  return `%${escaped}%`;
}
