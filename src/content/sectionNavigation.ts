import type { Section } from "../shared/types";

const SCROLL_MARGIN_TOP = "96px";
const HIGHLIGHT_DURATION_MS = 1200;

export function navigateToSection(section: Section): void {
  const { element } = section;
  const previousScrollMarginTop = element.style.scrollMarginTop;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  element.style.scrollMarginTop = SCROLL_MARGIN_TOP;
  element.scrollIntoView({
    behavior: reduceMotion ? "auto" : "smooth",
    block: "start",
  });

  if (!reduceMotion) {
    element.animate(
      [
        { backgroundColor: "transparent", boxShadow: "0 0 0 0 transparent" },
        {
          backgroundColor: "rgba(127, 127, 127, 0.12)",
          boxShadow: "0 0 0 3px rgba(127, 127, 127, 0.12)",
        },
        { backgroundColor: "transparent", boxShadow: "0 0 0 0 transparent" },
      ],
      {
        duration: HIGHLIGHT_DURATION_MS,
        easing: "ease-out",
      },
    );
  }

  window.setTimeout(() => {
    element.style.scrollMarginTop = previousScrollMarginTop;
  }, HIGHLIGHT_DURATION_MS);
}
