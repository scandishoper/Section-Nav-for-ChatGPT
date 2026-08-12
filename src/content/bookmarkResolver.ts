import { normalizeText } from "../shared/text";
import type { Bookmark, Section } from "../shared/types";
import type { ChatGPTAdapter } from "./chatgptAdapter";
import { parseSections } from "./sectionParser";

function getBookmarkMessageId(bookmark: Bookmark): string | null {
  if (bookmark.messageId) {
    return bookmark.messageId;
  }

  const messageIdPrefix = "message:";

  return bookmark.answerKey.startsWith(messageIdPrefix)
    ? bookmark.answerKey.slice(messageIdPrefix.length)
    : null;
}

function getContextMatchCount(bookmark: Bookmark, section: Section): number {
  let matches = 0;

  if (
    bookmark.previousHeadingHash &&
    bookmark.previousHeadingHash === section.previousHeadingHash
  ) {
    matches += 1;
  }

  if (bookmark.nextHeadingHash && bookmark.nextHeadingHash === section.nextHeadingHash) {
    matches += 1;
  }

  return matches;
}

function resolveVersionTwoBookmark(
  bookmark: Bookmark,
  sections: Section[],
): Section | null {
  const indexedSection = sections[bookmark.sectionIndex];

  if (
    indexedSection?.level === bookmark.sectionLevel &&
    indexedSection.textHash === bookmark.sectionTextHash
  ) {
    return indexedSection;
  }

  if (
    indexedSection?.level === bookmark.sectionLevel &&
    indexedSection.headingPath === bookmark.headingPath &&
    getContextMatchCount(bookmark, indexedSection) > 0
  ) {
    return indexedSection;
  }

  const textMatches = sections.filter(
    (section) =>
      section.level === bookmark.sectionLevel &&
      section.textHash === bookmark.sectionTextHash,
  );

  if (textMatches.length === 1) {
    return textMatches[0] ?? null;
  }

  const structuralMatches = sections.filter(
    (section) =>
      section.level === bookmark.sectionLevel &&
      section.headingPath === bookmark.headingPath &&
      getContextMatchCount(bookmark, section) > 0,
  );

  return structuralMatches.length === 1 ? (structuralMatches[0] ?? null) : null;
}

function resolveLegacyBookmark(bookmark: Bookmark, sections: Section[]): Section | null {
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
  const indexedMatch = compatibleSections.find(
    (section) => section.index === bookmark.sectionIndex,
  );

  if (indexedMatch) {
    return indexedMatch;
  }

  return compatibleSections.length === 1 ? (compatibleSections[0] ?? null) : null;
}

function getAnswerIndex(answer: HTMLElement, adapter: ChatGPTAdapter): number {
  return adapter.getAssistantMessages().indexOf(answer);
}

export function bookmarkMatchesSection(bookmark: Bookmark, section: Section): boolean {
  if (bookmark.sectionKey === section.key) {
    return true;
  }

  const sameAnswer =
    (bookmark.messageId !== undefined && bookmark.messageId === section.messageId) ||
    (bookmark.turnIndex !== undefined && bookmark.turnIndex === section.turnIndex) ||
    bookmark.answerKey === section.answerKey ||
    bookmark.answerFingerprint === section.answerFingerprint;

  if (!sameAnswer || bookmark.sectionIndex !== section.index) {
    return false;
  }

  return bookmark.locatorVersion === 2
    ? bookmark.sectionTextHash === section.textHash ||
        (bookmark.headingPath === section.headingPath &&
          getContextMatchCount(bookmark, section) > 0)
    : bookmark.sectionLevel === section.level &&
        normalizeText(bookmark.sectionText).toLocaleLowerCase() ===
          normalizeText(section.text).toLocaleLowerCase();
}

export function resolveBookmarkAnswer(
  bookmark: Bookmark,
  adapter: ChatGPTAdapter,
): HTMLElement | null {
  const messageId = getBookmarkMessageId(bookmark);

  if (messageId) {
    const message = adapter.getMessageById(messageId);

    if (message) {
      return message;
    }
  }

  if (bookmark.turnIndex !== undefined) {
    const message = adapter.getMessageByTurnIndex(bookmark.turnIndex);

    if (message) {
      return message;
    }
  }

  if (
    bookmark.locatorVersion === 2 &&
    (messageId !== null || bookmark.turnIndex !== undefined)
  ) {
    return null;
  }

  if (bookmark.answerFingerprint) {
    for (const [answerIndex, message] of adapter.getAssistantMessages().entries()) {
      const section = parseSections(message, adapter, answerIndex)[0];

      if (section?.answerFingerprint === bookmark.answerFingerprint) {
        return message;
      }
    }
  }

  return null;
}

export function resolveBookmark(
  bookmark: Bookmark,
  adapter: ChatGPTAdapter,
): Section | null {
  const answer = resolveBookmarkAnswer(bookmark, adapter);

  if (answer) {
    const sections = parseSections(answer, adapter, getAnswerIndex(answer, adapter));

    return bookmark.locatorVersion === 2
      ? resolveVersionTwoBookmark(bookmark, sections)
      : resolveLegacyBookmark(bookmark, sections);
  }

  if (bookmark.locatorVersion === 2) {
    return null;
  }

  const allSections = adapter
    .getAssistantMessages()
    .flatMap((message, answerIndex) => parseSections(message, adapter, answerIndex));
  const exactMatch = allSections.find((section) => section.key === bookmark.sectionKey);

  if (exactMatch) {
    return exactMatch;
  }

  const normalizedBookmarkText = normalizeText(bookmark.sectionText).toLocaleLowerCase();
  const compatibleSections = allSections.filter(
    (section) =>
      section.level === bookmark.sectionLevel &&
      normalizeText(section.text).toLocaleLowerCase() === normalizedBookmarkText,
  );

  return compatibleSections.length === 1 ? (compatibleSections[0] ?? null) : null;
}
