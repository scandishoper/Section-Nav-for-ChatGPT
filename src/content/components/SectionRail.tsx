import type { Section } from "../../shared/types";
import type { RailPosition } from "../positionManager";
import { SectionRailItem } from "./SectionRailItem";

interface SectionRailProps {
  activeSectionId: string | null;
  bookmarkedSectionKeys: ReadonlySet<string>;
  bookmarkCount: number;
  drawerOpen: boolean;
  onSectionSelect(section: Section): void;
  onToggleBookmark(section: Section): void;
  onToggleDrawer(): void;
  position: RailPosition;
  sections: Section[];
}

export function SectionRail({
  activeSectionId,
  bookmarkedSectionKeys,
  bookmarkCount,
  drawerOpen,
  onSectionSelect,
  onToggleBookmark,
  onToggleDrawer,
  position,
  sections,
}: SectionRailProps) {
  if (position.mode === "hidden") {
    return null;
  }

  return (
    <nav
      aria-label="当前回答章节"
      className={`section-rail is-${position.mode}`}
      data-mode={position.mode}
      style={{ left: `${position.left}px`, width: `${position.width}px` }}
    >
      <div className="section-rail-heading">
        <span className="section-rail-heading-text">Sections</span>
        <button
          aria-controls="section-nav-bookmark-drawer"
          aria-expanded={drawerOpen}
          aria-label={`打开书签列表，共 ${bookmarkCount} 项`}
          className="bookmark-drawer-trigger"
          onClick={onToggleDrawer}
          title={`Bookmarks (${bookmarkCount})`}
          type="button"
        >
          <span aria-hidden="true">{bookmarkCount > 0 ? "★" : "☆"}</span>
          {bookmarkCount > 0 ? <span>{bookmarkCount}</span> : null}
        </button>
      </div>
      {sections.length === 0 ? (
        <div className="section-rail-empty">当前回答无章节</div>
      ) : (
        <ol className="section-rail-list">
          {sections.map((section) => (
            <SectionRailItem
              active={section.id === activeSectionId}
              bookmarked={bookmarkedSectionKeys.has(section.key)}
              key={section.id}
              onSelect={onSectionSelect}
              onToggleBookmark={onToggleBookmark}
              section={section}
            />
          ))}
        </ol>
      )}
    </nav>
  );
}
