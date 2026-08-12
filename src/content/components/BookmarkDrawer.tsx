import type { Bookmark } from "../../shared/types";

interface BookmarkDrawerProps {
  bookmarks: Bookmark[];
  left: number;
  onClose(): void;
  onDelete(bookmark: Bookmark): void;
  onSelect(bookmark: Bookmark): void;
  resolvingBookmarkIds: ReadonlySet<string>;
  unresolvedBookmarkIds: ReadonlySet<string>;
}

export function BookmarkDrawer({
  bookmarks,
  left,
  onClose,
  onDelete,
  onSelect,
  resolvingBookmarkIds,
  unresolvedBookmarkIds,
}: BookmarkDrawerProps) {
  return (
    <section
      aria-labelledby="section-nav-bookmark-drawer-title"
      className="bookmark-drawer"
      id="section-nav-bookmark-drawer"
      role="dialog"
      style={{ left: `${left}px` }}
    >
      <header className="bookmark-drawer-header">
        <div>
          <div className="bookmark-drawer-title" id="section-nav-bookmark-drawer-title">
            Bookmarks
          </div>
          <div className="bookmark-drawer-subtitle">当前对话 · {bookmarks.length}</div>
        </div>
        <button
          aria-label="关闭书签列表"
          autoFocus
          className="bookmark-drawer-close"
          onClick={onClose}
          type="button"
        >
          ×
        </button>
      </header>

      {bookmarks.length === 0 ? (
        <div className="bookmark-drawer-empty">尚未收藏章节</div>
      ) : (
        <ul className="bookmark-list">
          {bookmarks.map((bookmark) => {
            const resolving = resolvingBookmarkIds.has(bookmark.id);
            const unresolved = unresolvedBookmarkIds.has(bookmark.id);

            return (
              <li className="bookmark-list-item" key={bookmark.id}>
                <button
                  className="bookmark-jump"
                  onClick={() => onSelect(bookmark)}
                  title={bookmark.sectionText}
                  type="button"
                >
                  <span aria-hidden="true" className="bookmark-star">
                    ★
                  </span>
                  <span className="bookmark-copy">
                    <span className="bookmark-title">{bookmark.sectionText}</span>
                    <span className={`bookmark-meta${unresolved ? " is-unresolved" : ""}`}>
                      {resolving
                        ? "正在定位…"
                        : unresolved
                        ? "目标暂不可用"
                        : `H${bookmark.sectionLevel} · Section ${bookmark.sectionIndex + 1}`}
                    </span>
                  </span>
                </button>
                <button
                  aria-label={`删除书签：${bookmark.sectionText}`}
                  className="bookmark-delete"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(bookmark);
                  }}
                  title="删除书签"
                  type="button"
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
