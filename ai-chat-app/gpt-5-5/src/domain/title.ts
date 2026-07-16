const DEFAULT_MAX_TITLE_LENGTH = 40;
const EMPTY_TITLE = 'Untitled conversation';

function normalizeWhitespace(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

export function deriveConversationTitle(
  firstUserMessage: string,
  maxLength = DEFAULT_MAX_TITLE_LENGTH
) {
  const normalized = normalizeWhitespace(firstUserMessage);

  if (normalized.length === 0) {
    return EMPTY_TITLE;
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const candidate = normalized.slice(0, maxLength + 1);
  const boundary = candidate.search(/\s+\S*$/u);
  const truncated =
    boundary >= Math.floor(maxLength * 0.5)
      ? candidate.slice(0, boundary)
      : normalized.slice(0, maxLength);

  return `${truncated.trimEnd()}...`;
}
