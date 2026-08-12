import type { ChatGPTAdapter } from "./chatgptAdapter";

export interface ActiveAnswer {
  element: HTMLElement;
  index: number;
  score: number;
}

export interface AnswerTrackerOptions {
  onActiveAnswerChange(activeAnswer: ActiveAnswer | null): void;
}

const READING_BAND_TOP_RATIO = 0.18;
const READING_BAND_BOTTOM_RATIO = 0.78;
const READING_LINE_RATIO = 0.3;
const SWITCH_THRESHOLD = 0.15;
const MESSAGE_REFRESH_INTERVAL_MS = 300;

function getIntersectionHeight(rect: DOMRect, top: number, bottom: number): number {
  return Math.max(0, Math.min(rect.bottom, bottom) - Math.max(rect.top, top));
}

function getAnswerScore(rect: DOMRect, viewportHeight: number): number {
  const bandTop = viewportHeight * READING_BAND_TOP_RATIO;
  const bandBottom = viewportHeight * READING_BAND_BOTTOM_RATIO;
  const bandHeight = bandBottom - bandTop;
  const intersectionHeight = getIntersectionHeight(rect, bandTop, bandBottom);

  if (intersectionHeight === 0) {
    return 0;
  }

  const visibleRatio = intersectionHeight / Math.min(Math.max(rect.height, 1), bandHeight);
  const readingLine = viewportHeight * READING_LINE_RATIO;
  const readingLineBonus = rect.top <= readingLine && rect.bottom >= readingLine ? 0.2 : 0;
  const answerCenter = (rect.top + rect.bottom) / 2;
  const bandCenter = (bandTop + bandBottom) / 2;
  const centerBonus = Math.max(0, 1 - Math.abs(answerCenter - bandCenter) / viewportHeight) * 0.05;

  return visibleRatio + readingLineBonus + centerBonus;
}

export class AnswerTracker {
  private activeAnswer: ActiveAnswer | null = null;
  private animationFrameId: number | null = null;
  private messageRefreshTimerId: number | null = null;
  private messages: HTMLElement[] = [];
  private started = false;

  constructor(
    private readonly adapter: ChatGPTAdapter,
    private readonly options: AnswerTrackerOptions,
  ) {}

  start(): void {
    if (this.started) {
      return;
    }

    this.started = true;
    this.refreshMessages();
    document.addEventListener("scroll", this.handleScroll, {
      capture: true,
      passive: true,
    });
    window.addEventListener("resize", this.handleResize, { passive: true });
    this.scheduleEvaluation();
  }

  refreshMessages(): void {
    this.messages = this.adapter.getAssistantMessages();

    if (
      this.activeAnswer &&
      !this.messages.includes(this.activeAnswer.element)
    ) {
      this.setActiveAnswer(null);
    }

    this.scheduleEvaluation();
  }

  getActiveAnswer(): ActiveAnswer | null {
    return this.activeAnswer;
  }

  reset(): void {
    this.messages = [];
    this.setActiveAnswer(null);
  }

  destroy(): void {
    if (!this.started) {
      return;
    }

    this.started = false;
    document.removeEventListener("scroll", this.handleScroll, true);
    window.removeEventListener("resize", this.handleResize);

    if (this.animationFrameId !== null) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.messageRefreshTimerId !== null) {
      window.clearTimeout(this.messageRefreshTimerId);
      this.messageRefreshTimerId = null;
    }

    this.messages = [];
    this.setActiveAnswer(null);
  }

  private readonly handleScroll = (): void => {
    this.scheduleMessageRefresh();
    this.scheduleEvaluation();
  };

  private readonly handleResize = (): void => {
    this.scheduleEvaluation();
  };

  private scheduleMessageRefresh(): void {
    if (this.messageRefreshTimerId !== null || !this.started) {
      return;
    }

    this.messageRefreshTimerId = window.setTimeout(() => {
      this.messageRefreshTimerId = null;
      this.refreshMessages();
    }, MESSAGE_REFRESH_INTERVAL_MS);
  }

  private scheduleEvaluation(): void {
    if (this.animationFrameId !== null || !this.started) {
      return;
    }

    this.animationFrameId = window.requestAnimationFrame(() => {
      this.animationFrameId = null;
      this.evaluate();
    });
  }

  private evaluate(): void {
    if (this.messages.length === 0) {
      this.setActiveAnswer(null);
      return;
    }

    const viewportHeight = window.innerHeight;
    const candidates = this.messages.map((element, index) => ({
      element,
      index,
      score: getAnswerScore(element.getBoundingClientRect(), viewportHeight),
    }));
    const bestCandidate = candidates.reduce((best, candidate) =>
      candidate.score > best.score ? candidate : best,
    );

    if (!this.activeAnswer) {
      this.setActiveAnswer(bestCandidate.score > 0 ? bestCandidate : null);
      return;
    }

    const currentCandidate = candidates.find(
      (candidate) => candidate.element === this.activeAnswer?.element,
    );

    if (!currentCandidate) {
      this.setActiveAnswer(bestCandidate.score > 0 ? bestCandidate : null);
      return;
    }

    if (bestCandidate.element === currentCandidate.element) {
      this.activeAnswer = currentCandidate;
      return;
    }

    const currentHasLeftReadingBand = currentCandidate.score === 0;
    const candidateClearlyWins = bestCandidate.score > currentCandidate.score + SWITCH_THRESHOLD;

    if (bestCandidate.score > 0 && (currentHasLeftReadingBand || candidateClearlyWins)) {
      this.setActiveAnswer(bestCandidate);
    }
  }

  private setActiveAnswer(activeAnswer: ActiveAnswer | null): void {
    const previousElement = this.activeAnswer?.element ?? null;
    this.activeAnswer = activeAnswer;

    if (previousElement !== activeAnswer?.element) {
      this.options.onActiveAnswerChange(activeAnswer);
    }
  }
}
