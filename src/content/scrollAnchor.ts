import type { Bookmark } from "../shared/types";
import type { ChatGPTAdapter } from "./chatgptAdapter";

interface ScrollAnchor {
  scrollOffset: number;
  scrollRange: number;
  scrollRatio: number;
}

function isScrollable(element: HTMLElement): boolean {
  const style = getComputedStyle(element);

  return (
    /(auto|scroll|overlay)/.test(style.overflowY) &&
    element.scrollHeight > element.clientHeight + 1
  );
}

function getDocumentScroller(): HTMLElement {
  return (document.scrollingElement as HTMLElement | null) ?? document.documentElement;
}

export function getScrollContainer(reference: HTMLElement): HTMLElement {
  let current: HTMLElement | null = reference;

  while (current && current !== document.body && current !== document.documentElement) {
    if (isScrollable(current)) {
      return current;
    }

    current = current.parentElement;
  }

  return getDocumentScroller();
}

function getScrollRange(scroller: HTMLElement): number {
  return Math.max(0, scroller.scrollHeight - scroller.clientHeight);
}

function getElementOffset(element: HTMLElement, scroller: HTMLElement): number {
  const elementRect = element.getBoundingClientRect();

  if (scroller === getDocumentScroller()) {
    return scroller.scrollTop + elementRect.top;
  }

  return scroller.scrollTop + elementRect.top - scroller.getBoundingClientRect().top;
}

function setScrollTop(scroller: HTMLElement, top: number): void {
  scroller.scrollTo({ behavior: "auto", top });
}

export function captureScrollAnchor(element: HTMLElement): ScrollAnchor {
  const scroller = getScrollContainer(element);
  const scrollRange = getScrollRange(scroller);
  const scrollOffset = Math.max(0, getElementOffset(element, scroller));

  return {
    scrollOffset,
    scrollRange,
    scrollRatio: scrollRange > 0 ? Math.min(1, scrollOffset / scrollRange) : 0,
  };
}

export function restoreScrollAnchor(
  bookmark: Bookmark,
  reference: HTMLElement,
): HTMLElement {
  const scroller = getScrollContainer(reference);
  const currentRange = getScrollRange(scroller);
  const storedRange = bookmark.scrollRange;
  const rangeChangedSubstantially =
    storedRange !== undefined &&
    storedRange > 0 &&
    Math.abs(currentRange - storedRange) / storedRange > 0.2;
  const ratioOffset =
    bookmark.scrollRatio === undefined ? undefined : bookmark.scrollRatio * currentRange;
  const preferredOffset = rangeChangedSubstantially
    ? ratioOffset
    : bookmark.scrollOffset ?? ratioOffset;

  if (preferredOffset !== undefined) {
    setScrollTop(scroller, Math.max(0, Math.min(currentRange, preferredOffset)));
  }

  return scroller;
}

function getScrollerViewportTop(scroller: HTMLElement): number {
  return scroller === getDocumentScroller() ? 0 : scroller.getBoundingClientRect().top;
}

export function nudgeTowardTurn(
  bookmark: Bookmark,
  adapter: ChatGPTAdapter,
  scroller: HTMLElement,
  attempt: number,
): boolean {
  if (bookmark.turnIndex === undefined) {
    return false;
  }

  const mountedTurns = adapter
    .getAssistantMessages()
    .map((message) => ({
      message,
      turnIndex: adapter.getTurnIndex(message),
    }))
    .filter(
      (entry): entry is { message: HTMLElement; turnIndex: number } =>
        entry.turnIndex !== null,
    )
    .sort((first, second) => first.turnIndex - second.turnIndex);

  if (mountedTurns.length === 0) {
    return false;
  }

  const lower = [...mountedTurns]
    .reverse()
    .find((entry) => entry.turnIndex < (bookmark.turnIndex ?? 0));
  const upper = mountedTurns.find((entry) => entry.turnIndex > (bookmark.turnIndex ?? 0));
  const viewportTop = getScrollerViewportTop(scroller);
  const viewportCenter = viewportTop + scroller.clientHeight / 2;

  if (lower && upper) {
    const turnSpan = upper.turnIndex - lower.turnIndex;
    const targetRatio = (bookmark.turnIndex - lower.turnIndex) / turnSpan;
    const lowerTop = lower.message.getBoundingClientRect().top;
    const upperTop = upper.message.getBoundingClientRect().top;
    const estimatedTop = lowerTop + (upperTop - lowerTop) * targetRatio;

    setScrollTop(scroller, scroller.scrollTop + estimatedTop - viewportCenter);
    return true;
  }

  const firstTurn = mountedTurns[0];
  const lastTurn = mountedTurns[mountedTurns.length - 1];
  const direction =
    firstTurn && bookmark.turnIndex < firstTurn.turnIndex
      ? -1
      : lastTurn && bookmark.turnIndex > lastTurn.turnIndex
        ? 1
        : 0;

  if (direction === 0) {
    return false;
  }

  const step = scroller.clientHeight * Math.min(4, 1 + attempt * 0.5);

  setScrollTop(scroller, scroller.scrollTop + direction * step);
  return true;
}
