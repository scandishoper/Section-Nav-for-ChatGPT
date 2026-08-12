import type { ChatGPTAdapter } from "./chatgptAdapter";
import { EXTENSION_ROOT_ID } from "./extensionRoot";

export interface ConversationMutation {
  activeAnswerChanged: boolean;
  messagesChanged: boolean;
}

export interface ConversationWatcherOptions {
  onMutation(mutation: ConversationMutation): void;
  onPotentialRouteChange?(): boolean;
}

const MUTATION_DEBOUNCE_MS = 300;

function isExtensionNode(node: Node): boolean {
  const element = node instanceof Element ? node : node.parentElement;

  return Boolean(
    element &&
      (element.id === EXTENSION_ROOT_ID || element.closest(`#${EXTENSION_ROOT_ID}`)),
  );
}

export class ConversationWatcher {
  private activeAnswer: HTMLElement | null = null;
  private debounceTimerId: number | null = null;
  private observer: MutationObserver | null = null;
  private observedRoot: Node | null = null;
  private pendingActiveAnswerChange = false;
  private pendingMessagesChange = false;
  private started = false;

  constructor(
    private readonly adapter: ChatGPTAdapter,
    private readonly options: ConversationWatcherOptions,
  ) {}

  start(): void {
    if (this.started) {
      return;
    }

    this.started = true;
    this.observer = new MutationObserver(this.handleMutations);
    this.refreshContainer();
  }

  setActiveAnswer(activeAnswer: HTMLElement | null): void {
    this.activeAnswer = activeAnswer;
  }

  refreshContainer(): void {
    if (!this.started || !this.observer) {
      return;
    }

    const nextRoot = this.adapter.getConversationContainer() ?? document.body;

    if (nextRoot === this.observedRoot) {
      return;
    }

    this.observer.disconnect();
    this.observedRoot = nextRoot;
    this.observer.observe(nextRoot, {
      attributeFilter: ["data-message-author-role", "data-message-id", "data-turn-id"],
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
    });
  }

  destroy(): void {
    if (!this.started) {
      return;
    }

    this.started = false;
    this.observer?.disconnect();
    this.observer = null;
    this.observedRoot = null;
    this.activeAnswer = null;
    this.pendingActiveAnswerChange = false;
    this.pendingMessagesChange = false;

    if (this.debounceTimerId !== null) {
      window.clearTimeout(this.debounceTimerId);
      this.debounceTimerId = null;
    }
  }

  private readonly handleMutations = (mutations: MutationRecord[]): void => {
    if (this.options.onPotentialRouteChange?.()) {
      this.pendingActiveAnswerChange = false;
      this.pendingMessagesChange = false;

      if (this.debounceTimerId !== null) {
        window.clearTimeout(this.debounceTimerId);
        this.debounceTimerId = null;
      }

      return;
    }

    for (const mutation of mutations) {
      if (isExtensionNode(mutation.target)) {
        continue;
      }

      if (this.activeAnswer?.contains(mutation.target)) {
        this.pendingActiveAnswerChange = true;
        continue;
      }

      const extensionOnlyMutation =
        mutation.type === "childList" &&
        [...mutation.addedNodes, ...mutation.removedNodes].every(isExtensionNode);

      if (!extensionOnlyMutation) {
        this.pendingMessagesChange = true;
      }
    }

    this.scheduleNotification();
  };

  private scheduleNotification(): void {
    if (
      this.debounceTimerId !== null ||
      (!this.pendingActiveAnswerChange && !this.pendingMessagesChange)
    ) {
      return;
    }

    this.debounceTimerId = window.setTimeout(() => {
      this.debounceTimerId = null;
      const mutation = {
        activeAnswerChanged: this.pendingActiveAnswerChange,
        messagesChanged: this.pendingMessagesChange,
      };

      this.pendingActiveAnswerChange = false;
      this.pendingMessagesChange = false;
      this.options.onMutation(mutation);
    }, MUTATION_DEBOUNCE_MS);
  }
}
