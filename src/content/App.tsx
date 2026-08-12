import type { Bookmark, Section } from "../shared/types";
import { BookmarkDrawer } from "./components/BookmarkDrawer";
import { SectionRail } from "./components/SectionRail";
import type { RailPosition } from "./positionManager";
import styles from "./styles/extension.css?inline";

interface AppProps {
  activeSectionId: string | null;
  bookmarks: Bookmark[];
  drawerOpen: boolean;
  onBookmarkDelete(bookmark: Bookmark): void;
  onBookmarkSelect(bookmark: Bookmark): void;
  onDrawerClose(): void;
  onDrawerToggle(): void;
  onSectionSelect(section: Section): void;
  onToggleBookmark(section: Section): void;
  position: RailPosition;
  sections: Section[];
  unresolvedBookmarkIds: ReadonlySet<string>;
}

export function App({
  activeSectionId,
  bookmarks,
  drawerOpen,
  onBookmarkDelete,
  onBookmarkSelect,
  onDrawerClose,
  onDrawerToggle,
  onSectionSelect,
  onToggleBookmark,
  position,
  sections,
  unresolvedBookmarkIds,
}: AppProps) {
  const bookmarkedSectionKeys = new Set(bookmarks.map((bookmark) => bookmark.sectionKey));
  const drawerLeft = Math.max(12, position.left - 312);

  return (
    <>
      <style>{styles}</style>
      <SectionRail
        activeSectionId={activeSectionId}
        bookmarkedSectionKeys={bookmarkedSectionKeys}
        bookmarkCount={bookmarks.length}
        drawerOpen={drawerOpen}
        onSectionSelect={onSectionSelect}
        onToggleBookmark={onToggleBookmark}
        onToggleDrawer={onDrawerToggle}
        position={position}
        sections={sections}
      />
      {drawerOpen && position.mode !== "hidden" ? (
        <BookmarkDrawer
          bookmarks={bookmarks}
          left={drawerLeft}
          onClose={onDrawerClose}
          onDelete={onBookmarkDelete}
          onSelect={onBookmarkSelect}
          unresolvedBookmarkIds={unresolvedBookmarkIds}
        />
      ) : null}
    </>
  );
}
