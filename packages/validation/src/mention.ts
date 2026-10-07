/**
 * Mention tokens, shared between the composer (inserting one) and the
 * renderer (splitting a body into plain-text and mention segments).
 * Mirrors extract_mentions() in the database exactly, so a UI that
 * highlights a mention agrees with who actually gets notified.
 */
const MENTION_PATTERN =
  /@\[([^\]]*)\]\(([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\)/g;

export function buildMentionToken(name: string, userId: string): string {
  return `@[${name}](${userId})`;
}

export interface MentionSegment {
  type: "text" | "mention";
  text: string;
  /** Present only when type is "mention". */
  userId?: string;
}

/** Splits body into alternating text/mention segments, in order, for rendering. */
export function splitMentionSegments(body: string): MentionSegment[] {
  const segments: MentionSegment[] = [];
  let lastIndex = 0;

  for (const match of body.matchAll(MENTION_PATTERN)) {
    const [full, name, userId] = match;
    const index = match.index ?? 0;
    if (index > lastIndex) {
      segments.push({ type: "text", text: body.slice(lastIndex, index) });
    }
    segments.push({ type: "mention", text: name ?? "", userId });
    lastIndex = index + full.length;
  }
  if (lastIndex < body.length) {
    segments.push({ type: "text", text: body.slice(lastIndex) });
  }
  return segments;
}
