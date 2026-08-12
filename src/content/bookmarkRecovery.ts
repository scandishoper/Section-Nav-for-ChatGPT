import type { Bookmark, Section } from "../shared/types";
import type { ChatGPTAdapter } from "./chatgptAdapter";
import { resolveBookmark, resolveBookmarkAnswer } from "./bookmarkResolver";
import {
  getScrollContainer,
  nudgeTowardTurn,
  restoreScrollAnchor,
} from "./scrollAnchor";

const MAX_RECOVERY_ATTEMPTS = 12;

interface BookmarkRecoveryOptions {
  isCanceled(): boolean;
}

function waitForDomUpdate(root: Node, timeout: number): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const observer = new MutationObserver(() => finish());
    const timerId = window.setTimeout(() => finish(), timeout);
    const finish = () => {
      if (settled) {
        return;
      }

      settled = true;
      window.clearTimeout(timerId);
      observer.disconnect();
      resolve();
    };

    observer.observe(root, { childList: true, subtree: true });
  });
}

export async function recoverBookmarkTarget(
  bookmark: Bookmark,
  adapter: ChatGPTAdapter,
  options: BookmarkRecoveryOptions,
): Promise<Section | null> {
  const initialTarget = resolveBookmark(bookmark, adapter);

  if (initialTarget) {
    return initialTarget;
  }

  const reference = adapter.getConversationContainer() ?? document.body;
  let scroller = restoreScrollAnchor(bookmark, reference);

  for (let attempt = 0; attempt < MAX_RECOVERY_ATTEMPTS; attempt += 1) {
    if (options.isCanceled()) {
      return null;
    }

    const answer = resolveBookmarkAnswer(bookmark, adapter);

    if (answer) {
      answer.scrollIntoView({ behavior: "auto", block: "center" });
      scroller = getScrollContainer(answer);
    } else if (attempt > 0) {
      nudgeTowardTurn(bookmark, adapter, scroller, attempt);
    }

    const root = adapter.getConversationContainer() ?? document.body;
    await waitForDomUpdate(root, Math.min(500, 180 + attempt * 35));

    if (options.isCanceled()) {
      return null;
    }

    const target = resolveBookmark(bookmark, adapter);

    if (target) {
      return target;
    }
  }

  return null;
}
