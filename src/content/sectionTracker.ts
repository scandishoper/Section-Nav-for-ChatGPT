import type { Section } from "../shared/types";

export interface SectionTrackerOptions {
  onActiveSectionChange(sectionId: string | null): void;
}

const READING_LINE_RATIO = 0.3;

export class SectionTracker {
  private activeSectionId: string | null = null;
  private animationFrameId: number | null = null;
  private sections: Section[] = [];
  private started = false;

  constructor(private readonly options: SectionTrackerOptions) {}

  start(): void {
    if (this.started) {
      return;
    }

    this.started = true;
    document.addEventListener("scroll", this.handleViewportChange, {
      capture: true,
      passive: true,
    });
    window.addEventListener("resize", this.handleViewportChange, { passive: true });
    this.scheduleEvaluation();
  }

  setSections(sections: Section[]): void {
    this.sections = sections;

    if (
      this.activeSectionId &&
      !sections.some((section) => section.id === this.activeSectionId)
    ) {
      this.setActiveSection(null);
    }

    this.scheduleEvaluation();
  }

  destroy(): void {
    if (!this.started) {
      return;
    }

    this.started = false;
    document.removeEventListener("scroll", this.handleViewportChange, true);
    window.removeEventListener("resize", this.handleViewportChange);

    if (this.animationFrameId !== null) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.sections = [];
    this.setActiveSection(null);
  }

  private readonly handleViewportChange = (): void => {
    this.scheduleEvaluation();
  };

  private scheduleEvaluation(): void {
    if (!this.started || this.animationFrameId !== null) {
      return;
    }

    this.animationFrameId = window.requestAnimationFrame(() => {
      this.animationFrameId = null;
      this.evaluate();
    });
  }

  private evaluate(): void {
    if (this.sections.length === 0) {
      this.setActiveSection(null);
      return;
    }

    const readingLine = window.innerHeight * READING_LINE_RATIO;
    let activeSection = this.sections[0];

    for (const section of this.sections) {
      if (section.element.getBoundingClientRect().top <= readingLine) {
        activeSection = section;
      } else {
        break;
      }
    }

    this.setActiveSection(activeSection?.id ?? null);
  }

  private setActiveSection(sectionId: string | null): void {
    if (this.activeSectionId === sectionId) {
      return;
    }

    this.activeSectionId = sectionId;
    this.options.onActiveSectionChange(sectionId);
  }
}
