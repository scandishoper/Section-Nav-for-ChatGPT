const THEME_ATTRIBUTES = ["class", "style", "data-theme", "data-color-scheme"];
const TRANSPARENT_COLORS = new Set(["transparent", "rgba(0, 0, 0, 0)"]);

function parseRgb(color: string): [number, number, number] | null {
  const match = color.match(/rgba?\(\s*(\d+(?:\.\d+)?)\D+(\d+(?:\.\d+)?)\D+(\d+(?:\.\d+)?)/);

  if (!match?.[1] || !match[2] || !match[3]) {
    return null;
  }

  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function getRelativeLuminance(color: string): number | null {
  const rgb = parseRgb(color);

  if (!rgb) {
    return null;
  }

  const channels = rgb.map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * (channels[0] ?? 0) + 0.7152 * (channels[1] ?? 0) + 0.0722 * (channels[2] ?? 0);
}

function getPageBackground(): string {
  const bodyBackground = getComputedStyle(document.body).backgroundColor;

  if (!TRANSPARENT_COLORS.has(bodyBackground)) {
    return bodyBackground;
  }

  const rootBackground = getComputedStyle(document.documentElement).backgroundColor;

  if (!TRANSPARENT_COLORS.has(rootBackground)) {
    return rootBackground;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "rgb(33, 33, 33)"
    : "rgb(255, 255, 255)";
}

export class ThemeManager {
  private animationFrameId: number | null = null;
  private bodyObserver: MutationObserver | null = null;
  private observedBody: HTMLElement | null = null;
  private rootObserver: MutationObserver | null = null;
  private started = false;
  private readonly systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");

  constructor(private readonly host: HTMLElement) {}

  start(): void {
    if (this.started) {
      return;
    }

    this.started = true;
    this.rootObserver = new MutationObserver(this.handleRootMutation);
    this.bodyObserver = new MutationObserver(this.scheduleUpdate);
    this.rootObserver.observe(document.documentElement, {
      attributeFilter: THEME_ATTRIBUTES,
      attributes: true,
      childList: true,
    });
    this.observeBody();
    this.systemThemeQuery.addEventListener("change", this.scheduleUpdate);
    this.scheduleUpdate();
  }

  destroy(): void {
    if (!this.started) {
      return;
    }

    this.started = false;
    this.rootObserver?.disconnect();
    this.bodyObserver?.disconnect();
    this.rootObserver = null;
    this.bodyObserver = null;
    this.observedBody = null;
    this.systemThemeQuery.removeEventListener("change", this.scheduleUpdate);

    if (this.animationFrameId !== null) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private observeBody(): void {
    if (!this.bodyObserver || this.observedBody === document.body) {
      return;
    }

    this.bodyObserver.disconnect();
    this.observedBody = document.body;
    this.bodyObserver.observe(document.body, {
      attributeFilter: THEME_ATTRIBUTES,
      attributes: true,
    });
  }

  private readonly handleRootMutation = (): void => {
    this.observeBody();
    this.scheduleUpdate();
  };

  private readonly scheduleUpdate = (): void => {
    if (!this.started || this.animationFrameId !== null) {
      return;
    }

    this.animationFrameId = window.requestAnimationFrame(() => {
      this.animationFrameId = null;
      this.updateTheme();
    });
  };

  private updateTheme(): void {
    const bodyStyles = getComputedStyle(document.body);
    const rootStyles = getComputedStyle(document.documentElement);
    const textColor = bodyStyles.color || rootStyles.color || "CanvasText";
    const backgroundColor = getPageBackground();
    const luminance = getRelativeLuminance(backgroundColor);
    const isDark = luminance === null ? this.systemThemeQuery.matches : luminance < 0.45;

    this.host.dataset.sectionNavTheme = isDark ? "dark" : "light";
    this.host.style.colorScheme = isDark ? "dark" : "light";
    this.host.style.setProperty("--ext-page-text", textColor);
    this.host.style.setProperty("--ext-page-background", backgroundColor);
  }
}
