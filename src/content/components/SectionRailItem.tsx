import { useEffect, useRef, type CSSProperties } from "react";

import type { Section } from "../../shared/types";

interface SectionRailItemProps {
  active: boolean;
  bookmarked: boolean;
  onSelect(section: Section): void;
  onToggleBookmark(section: Section): void;
  section: Section;
}

export function SectionRailItem({
  active,
  bookmarked,
  onSelect,
  onToggleBookmark,
  section,
}: SectionRailItemProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const depthStyle = {
    "--section-depth": section.depth,
  } as CSSProperties;

  useEffect(() => {
    if (active) {
      buttonRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }, [active]);

  return (
    <li className="section-rail-list-item" style={depthStyle}>
      <button
        aria-current={active ? "location" : undefined}
        aria-label={`跳转到章节：${section.text}`}
        className={`section-rail-item${active ? " is-active" : ""}`}
        onClick={() => onSelect(section)}
        ref={buttonRef}
        title={section.text}
        type="button"
      >
        <span aria-hidden="true" className="section-rail-marker" />
        <span className="section-rail-text">{section.text}</span>
      </button>
      <button
        aria-label={bookmarked ? `取消收藏章节：${section.text}` : `收藏章节：${section.text}`}
        aria-pressed={bookmarked}
        className={`section-bookmark-toggle${bookmarked ? " is-bookmarked" : ""}`}
        onClick={(event) => {
          event.stopPropagation();
          onToggleBookmark(section);
        }}
        title={bookmarked ? "取消收藏" : "收藏章节"}
        type="button"
      >
        <span aria-hidden="true">{bookmarked ? "★" : "☆"}</span>
      </button>
    </li>
  );
}
