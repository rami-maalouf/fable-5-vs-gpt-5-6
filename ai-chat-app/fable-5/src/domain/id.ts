// local-only id: time component keeps ids roughly sortable, random suffix
// avoids collisions; no crypto dependency needed for a per-device store
let counter = 0;

export function createId(): string {
  counter = (counter + 1) % 1296;
  return `${Date.now().toString(36)}-${counter.toString(36).padStart(2, '0')}${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}
