export const TITLE_MAX_CHARS = 40;

const FALLBACK_TITLE = 'New chat';

// title = first user message, collapsed to one line and truncated to
// ~40 chars at a word boundary with a trailing ellipsis
export function deriveTitle(firstUserMessage: string): string {
  const collapsed = firstUserMessage.replace(/\s+/g, ' ').trim();
  if (collapsed.length === 0) return FALLBACK_TITLE;

  // count in code points so surrogate pairs (emoji) are never split
  const codePoints = [...collapsed];
  if (codePoints.length <= TITLE_MAX_CHARS) return collapsed;

  const hardCut = codePoints.slice(0, TITLE_MAX_CHARS).join('');
  const lastSpace = hardCut.lastIndexOf(' ');
  const stem = lastSpace > 0 ? hardCut.slice(0, lastSpace) : hardCut;
  return `${stem}…`;
}
