export type RailMode = "full" | "compact" | "mini" | "hidden";

export interface RailPosition {
  left: number;
  mode: RailMode;
  width: number;
}

export interface PositionManagerOptions {
  onPositionChange(position: RailPosition): void;
}

interface ModeConfiguration {
  gap: number;
  mode: Exclude<RailMode, "hidden">;
  width: number;
}

const NATIVE_TOC_SAFE_AREA = 88;
const FULL_BREAKPOINT = 1400;
const COMPACT_BREAKPOINT = 1200;

const FULL_MODE: ModeConfiguration = { gap: 24, mode: "full", width: 148 };
const COMPACT_MODE: ModeConfiguration = { gap: 18, mode: "compact", width: 112 };
const MINI_MODE: ModeConfiguration = { gap: 12, mode: "mini", width: 32 };

export const HIDDEN_RAIL_POSITION: RailPosition = {
  left: 0,
  mode: "hidden",
  width: 0,
};

function positionsEqual(first: RailPosition, second: RailPosition): boolean {
  return (
    first.left === second.left &&
    first.mode === second.mode &&
    first.width === second.width
  );
}

function getPreferredModes(viewportWidth: number): ModeConfiguration[] {
  if (viewportWidth >= FULL_BREAKPOINT) {
    return [FULL_MODE, COMPACT_MODE, MINI_MODE];
  }

  if (viewportWidth >= COMPACT_BREAKPOINT) {
    return [COMPACT_MODE, MINI_MODE];
  }

  return [MINI_MODE];
}

export class PositionManager {
  private animationFrameId: number | null = null;
  private currentPosition = HIDDEN_RAIL_POSITION;
  private resizeObserver: ResizeObserver | null = null;
  private started = false;
  private target: HTMLElement | null = null;

  constructor(private readonly options: PositionManagerOptions) {}

  start(): void {
    if (this.started) {
      return;
    }

    this.started = true;
    document.addEventListener("transitionrun", this.handleLayoutChange, true);
    document.addEventListener("transitionend", this.handleLayoutChange, true);
    window.addEventListener("resize", this.handleLayoutChange, { passive: true });
    this.resizeObserver = new ResizeObserver(this.handleLayoutChange);
    this.scheduleUpdate();
  }

  setTarget(target: HTMLElement | null): void {
    if (this.target === target) {
      this.scheduleUpdate();
      return;
    }

    this.resizeObserver?.disconnect();
    this.target = target;

    if (target) {
      this.resizeObserver?.observe(target);
    }

    this.scheduleUpdate();
  }

  destroy(): void {
    if (!this.started) {
      return;
    }

    this.started = false;
    document.removeEventListener("transitionrun", this.handleLayoutChange, true);
    document.removeEventListener("transitionend", this.handleLayoutChange, true);
    window.removeEventListener("resize", this.handleLayoutChange);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.target = null;

    if (this.animationFrameId !== null) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.updatePosition(HIDDEN_RAIL_POSITION);
  }

  private readonly handleLayoutChange = (): void => {
    this.scheduleUpdate();
  };

  private scheduleUpdate(): void {
    if (!this.started || this.animationFrameId !== null) {
      return;
    }

    this.animationFrameId = window.requestAnimationFrame(() => {
      this.animationFrameId = null;
      this.evaluate();
    });
  }

  private evaluate(): void {
    if (!this.target?.isConnected) {
      this.updatePosition(HIDDEN_RAIL_POSITION);
      return;
    }

    const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
    const targetRect = this.target.getBoundingClientRect();
    const maximumRight = viewportWidth - NATIVE_TOC_SAFE_AREA;

    for (const configuration of getPreferredModes(viewportWidth)) {
      const left = Math.round(targetRect.right + configuration.gap);

      if (left + configuration.width <= maximumRight) {
        this.updatePosition({
          left,
          mode: configuration.mode,
          width: configuration.width,
        });
        return;
      }
    }

    this.updatePosition(HIDDEN_RAIL_POSITION);
  }

  private updatePosition(position: RailPosition): void {
    if (positionsEqual(this.currentPosition, position)) {
      return;
    }

    this.currentPosition = position;
    this.options.onPositionChange(position);
  }
}
