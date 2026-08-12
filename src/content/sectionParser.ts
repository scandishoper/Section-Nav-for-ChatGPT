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
  messageId: string | null;
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
      messageId,
    };
  }

  return {
    fingerprint,
    key: `fingerprint:${fingerprint}`,
    messageId: null,
  };
}

function getHeadingPaths(
  headings: Array<{ level: SectionLevel }>,
  minimumLevel: number,
): string[] {
  const levelCounts = new Map<SectionLevel, number>();

  return headings.map((heading) => {
    levelCounts.set(heading.level, (levelCounts.get(heading.level) ?? 0) + 1);

    for (let level = heading.level + 1; level <= 3; level += 1) {
      levelCounts.delete(level as SectionLevel);
    }

    const pathParts: string[] = [];

    for (let level = minimumLevel; level <= heading.level; level += 1) {
      pathParts.push(`h${level}:${levelCounts.get(level as SectionLevel) ?? 0}`);
    }

    return pathParts.join("/");
  });
}

export function parseSections(
  message: HTMLElement,
  adapter: ChatGPTAdapter,
  answerIndex = -1,
): Section[] {
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
  const headingPaths = getHeadingPaths(parsedHeadings, minimumLevel);
  const headingHashes = parsedHeadings.map((heading) =>
    hashText(heading.text.toLocaleLowerCase()),
  );

  return parsedHeadings.map((heading, index) => {
    const normalizedHeading = heading.text.toLocaleLowerCase();
    const key = `${answerIdentity.key}:heading:${index}`;

    return {
      answerFingerprint: answerIdentity.fingerprint,
      answerIndex,
      answerKey: answerIdentity.key,
      depth: heading.level - minimumLevel,
      element: heading.element,
      headingPath: headingPaths[index] ?? `heading:${index}`,
      id: `section-${hashText(key)}`,
      index,
      key,
      level: heading.level,
      messageId: answerIdentity.messageId,
      nextHeadingHash: headingHashes[index + 1] ?? null,
      previousHeadingHash: headingHashes[index - 1] ?? null,
      text: heading.text,
      textHash: headingHashes[index] ?? hashText(normalizedHeading),
      turnIndex: adapter.getTurnIndex(message),
    };
  });
}
