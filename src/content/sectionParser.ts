import type { Section, SectionLevel } from "../shared/types";
import { hashText } from "../shared/hash";
import { normalizeText } from "../shared/text";
import type { ChatGPTAdapter } from "./chatgptAdapter";

const ANSWER_FINGERPRINT_LENGTH = 280;

function getHeadingLevel(heading: HTMLHeadingElement): SectionLevel | null {
  const level = Number(heading.tagName.slice(1));

  return level === 1 || level === 2 || level === 3 ? level : null;
}

interface AnswerIdentity {
  fingerprint: string;
  key: string;
}

function getAnswerIdentity(message: HTMLElement, adapter: ChatGPTAdapter): AnswerIdentity {
  const messageId = adapter.getMessageId(message);
  const content = adapter.getMessageContent(message);
  const fingerprintSource = normalizeText(content?.textContent ?? "").slice(
    0,
    ANSWER_FINGERPRINT_LENGTH,
  );
  const fingerprint = hashText(fingerprintSource);

  if (messageId) {
    return {
      fingerprint,
      key: `message:${messageId}`,
    };
  }

  return {
    fingerprint,
    key: `fingerprint:${fingerprint}`,
  };
}

export function parseSections(message: HTMLElement, adapter: ChatGPTAdapter): Section[] {
  const parsedHeadings = adapter
    .getHeadings(message)
    .map((element) => ({
      element,
      level: getHeadingLevel(element),
      text: normalizeText(element.textContent ?? ""),
    }))
    .filter(
      (
        heading,
      ): heading is {
        element: HTMLHeadingElement;
        level: SectionLevel;
        text: string;
      } => heading.level !== null && heading.text.length > 0,
    );

  if (parsedHeadings.length === 0) {
    return [];
  }

  const minimumLevel = Math.min(...parsedHeadings.map((heading) => heading.level));
  const answerIdentity = getAnswerIdentity(message, adapter);
  const occurrences = new Map<string, number>();

  return parsedHeadings.map((heading, index) => {
    const normalizedHeading = heading.text.toLocaleLowerCase();
    const occurrenceKey = `${heading.level}:${normalizedHeading}`;
    const occurrence = occurrences.get(occurrenceKey) ?? 0;
    const key = `${answerIdentity.key}:${occurrenceKey}:${occurrence}`;

    occurrences.set(occurrenceKey, occurrence + 1);

    return {
      answerFingerprint: answerIdentity.fingerprint,
      answerKey: answerIdentity.key,
      depth: heading.level - minimumLevel,
      element: heading.element,
      id: `section-${hashText(key)}`,
      index,
      key,
      level: heading.level,
      text: heading.text,
    };
  });
}
