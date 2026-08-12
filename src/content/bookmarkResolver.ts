import type { Bookmark, Section } from "../shared/types";
import { normalizeText } from "../shared/text";
import type { ChatGPTAdapter } from "./chatgptAdapter";
import { parseSections } from "./sectionParser";

export function resolveBookmark(
  bookmark: Bookmark,
  adapter: ChatGPTAdapter,
): Section | null {
  const sections = adapter
    .getAssistantMessages()
    .flatMap((message) => parseSections(message, adapter));
  const exactMatch = sections.find((section) => section.key === bookmark.sectionKey);

  if (exactMatch) {
    return exactMatch;
  }

  const normalizedBookmarkText = normalizeText(bookmark.sectionText).toLocaleLowerCase();
  const compatibleSections = sections.filter(
    (section) =>
      section.level === bookmark.sectionLevel &&
      normalizeText(section.text).toLocaleLowerCase() === normalizedBookmarkText,
  );
  const sameAnswerMatch = compatibleSections.find(
    (section) =>
      section.answerKey === bookmark.answerKey ||
      section.answerFingerprint === bookmark.answerFingerprint,
  );

  if (sameAnswerMatch) {
    return sameAnswerMatch;
  }

  return compatibleSections.length === 1 ? (compatibleSections[0] ?? null) : null;
}
