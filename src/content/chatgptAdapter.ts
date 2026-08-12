import { EXTENSION_ROOT_ID } from "./extensionRoot";

export interface ChatGPTAdapter {
  getConversationKey(): string;
  getConversationContainer(): HTMLElement | null;
  getAssistantMessages(): HTMLElement[];
  getMessageById(messageId: string): HTMLElement | null;
  getMessageByTurnIndex(turnIndex: number): HTMLElement | null;
  getMessageId(message: HTMLElement): string | null;
  getMessageContent(message: HTMLElement): HTMLElement | null;
  getHeadings(message: HTMLElement): HTMLHeadingElement[];
  getTurnIndex(message: HTMLElement): number | null;
}

const SELECTORS = {
  assistantAuthor: '[data-message-author-role="assistant"]',
  conversationContainer: [
    '[data-testid="conversation-turns"]',
    '[role="main"]',
    "main",
  ],
  messageRoot: [
    '[data-testid^="conversation-turn-"]',
    "article[data-turn]",
    "article",
  ],
  messageContent: [
    '[data-message-content="true"]',
    '[data-testid="message-content"]',
    '[role="document"]',
    ".markdown",
  ],
  headings: "h1, h2, h3",
} as const;

const MESSAGE_ID_ATTRIBUTES = ["data-message-id", "data-turn-id"] as const;
const CONVERSATION_SEGMENTS = new Set(["c", "share"]);
const TURN_TEST_ID_PATTERN = /^conversation-turn-(\d+)$/;

function normalizePathname(pathname: string): string {
  const normalized = pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    })
    .join("/");

  return normalized ? `/${normalized}` : "/";
}

function queryFirstElement(
  root: ParentNode,
  selectors: readonly string[],
): HTMLElement | null {
  for (const selector of selectors) {
    const element = root.querySelector<HTMLElement>(selector);

    if (element) {
      return element;
    }
  }

  return null;
}

function getMessageRoot(authorElement: HTMLElement): HTMLElement {
  for (const selector of SELECTORS.messageRoot) {
    const root = authorElement.closest<HTMLElement>(selector);

    if (root) {
      return root;
    }
  }

  return authorElement;
}

function isExtensionElement(element: Element): boolean {
  return element.id === EXTENSION_ROOT_ID || Boolean(element.closest(`#${EXTENSION_ROOT_ID}`));
}

function uniqueElements(elements: HTMLElement[]): HTMLElement[] {
  return [...new Set(elements)];
}

function queryAttributeValue(attribute: string, value: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[${attribute}="${CSS.escape(value)}"]`);
}

export const chatgptAdapter: ChatGPTAdapter = {
  getConversationKey() {
    const segments = window.location.pathname.split("/").filter(Boolean);

    for (let index = 0; index < segments.length - 1; index += 1) {
      const segment = segments[index];

      if (segment && CONVERSATION_SEGMENTS.has(segment)) {
        const value = segments[index + 1];

        if (value) {
          return `${segment}:${value}`;
        }
      }
    }

    return `path:${normalizePathname(window.location.pathname)}`;
  },

  getConversationContainer() {
    const assistantMessage = document.querySelector<HTMLElement>(SELECTORS.assistantAuthor);
    const semanticMain = assistantMessage?.closest<HTMLElement>('[role="main"], main');

    if (semanticMain) {
      return semanticMain;
    }

    const candidate = queryFirstElement(document, SELECTORS.conversationContainer);

    if (candidate?.querySelector(SELECTORS.assistantAuthor)) {
      return candidate;
    }

    return null;
  },

  getAssistantMessages() {
    const container = this.getConversationContainer() ?? document;
    const authorElements = Array.from(
      container.querySelectorAll<HTMLElement>(SELECTORS.assistantAuthor),
    ).filter((element) => !isExtensionElement(element));

    return uniqueElements(authorElements.map(getMessageRoot));
  },

  getMessageById(messageId) {
    for (const attribute of MESSAGE_ID_ATTRIBUTES) {
      const candidate = queryAttributeValue(attribute, messageId);

      if (candidate) {
        return getMessageRoot(candidate);
      }
    }

    if (messageId.startsWith("turn:")) {
      const turnId = messageId.slice("turn:".length);
      const candidate = queryAttributeValue("data-testid", `conversation-turn-${turnId}`);

      if (candidate) {
        return candidate;
      }
    }

    const candidates = document.querySelectorAll<HTMLElement>(
      '[data-message-id], [data-turn-id], [data-testid^="conversation-turn-"]',
    );

    for (const candidate of candidates) {
      const root = getMessageRoot(candidate);

      if (this.getMessageId(root) === messageId) {
        return root;
      }
    }

    return null;
  },

  getMessageByTurnIndex(turnIndex) {
    return queryAttributeValue("data-testid", `conversation-turn-${turnIndex}`);
  },

  getMessageId(message) {
    const assistantElement = message.matches(SELECTORS.assistantAuthor)
      ? message
      : message.querySelector<HTMLElement>(SELECTORS.assistantAuthor);
    const candidates = [assistantElement, message].filter(
      (element): element is HTMLElement => Boolean(element),
    );

    for (const candidate of candidates) {
      for (const attribute of MESSAGE_ID_ATTRIBUTES) {
        const value = candidate.getAttribute(attribute)?.trim();

        if (value) {
          return value;
        }
      }

      const testId = candidate.getAttribute("data-testid");
      const testIdMatch = testId?.match(/^conversation-turn-(.+)$/);

      if (testIdMatch?.[1]) {
        return `turn:${testIdMatch[1]}`;
      }
    }

    return null;
  },

  getMessageContent(message) {
    const assistantElement = message.matches(SELECTORS.assistantAuthor)
      ? message
      : message.querySelector<HTMLElement>(SELECTORS.assistantAuthor);

    if (!assistantElement) {
      return null;
    }

    return queryFirstElement(assistantElement, SELECTORS.messageContent) ?? assistantElement;
  },

  getHeadings(message) {
    const content = this.getMessageContent(message);

    if (!content) {
      return [];
    }

    return Array.from(content.querySelectorAll<HTMLHeadingElement>(SELECTORS.headings)).filter(
      (heading) => !isExtensionElement(heading),
    );
  },

  getTurnIndex(message) {
    const candidates = [
      message,
      message.closest<HTMLElement>('[data-testid^="conversation-turn-"]'),
    ].filter((element): element is HTMLElement => Boolean(element));

    for (const candidate of candidates) {
      const match = candidate.getAttribute("data-testid")?.match(TURN_TEST_ID_PATTERN);
      const value = match?.[1] ? Number(match[1]) : Number.NaN;

      if (Number.isInteger(value) && value >= 0) {
        return value;
      }
    }

    return null;
  },
};
