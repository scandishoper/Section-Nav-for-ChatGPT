import type { ChatGPTAdapter } from "./chatgptAdapter";

export interface ConversationRouteChange {
  currentKey: string;
  previousKey: string;
}

export interface ConversationRouteWatcherOptions {
  onRouteChange(change: ConversationRouteChange): void;
}

const ROUTE_CHECK_INTERVAL_MS = 400;

export class ConversationRouteWatcher {
  private currentKey: string;
  private intervalId: number | null = null;
  private started = false;

  constructor(
    private readonly adapter: ChatGPTAdapter,
    private readonly options: ConversationRouteWatcherOptions,
  ) {
    this.currentKey = adapter.getConversationKey();
  }

  start(): void {
    if (this.started) {
      return;
    }

    this.started = true;
    window.addEventListener("popstate", this.checkRoute);
    window.addEventListener("hashchange", this.checkRoute);
    this.intervalId = window.setInterval(this.checkRoute, ROUTE_CHECK_INTERVAL_MS);
  }

  destroy(): void {
    if (!this.started) {
      return;
    }

    this.started = false;
    window.removeEventListener("popstate", this.checkRoute);
    window.removeEventListener("hashchange", this.checkRoute);

    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  sync(): boolean {
    const nextKey = this.adapter.getConversationKey();

    if (nextKey === this.currentKey) {
      return false;
    }

    const previousKey = this.currentKey;
    this.currentKey = nextKey;
    this.options.onRouteChange({ currentKey: nextKey, previousKey });
    return true;
  }

  private readonly checkRoute = (): void => {
    this.sync();
  };
}
