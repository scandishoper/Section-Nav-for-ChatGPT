import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import type { Bookmark, Section } from "../shared/types";
import { App } from "./App";
import { AnswerTracker, type ActiveAnswer } from "./answerTracker";
import { resolveBookmark } from "./bookmarkResolver";
import { bookmarkService } from "./bookmarkService";
import { chatgptAdapter } from "./chatgptAdapter";
import { ConversationRouteWatcher } from "./conversationRouteWatcher";
import { ConversationWatcher } from "./conversationWatcher";
import { getOrCreateExtensionRoot } from "./extensionRoot";
import {
  HIDDEN_RAIL_POSITION,
  PositionManager,
  type RailPosition,
} from "./positionManager";
import { navigateToSection } from "./sectionNavigation";
import { parseSections } from "./sectionParser";
import { SectionTracker } from "./sectionTracker";
import { ThemeManager } from "./themeManager";

const INITIAL_REFRESH_DELAYS = [100, 400, 1000, 2000, 3500] as const;

function sectionsEqual(first: Section[], second: Section[]): boolean {
  return (
    first.length === second.length &&
    first.every(
      (section, index) =>
        section.id === second[index]?.id &&
        section.element === second[index]?.element &&
        section.text === second[index]?.text,
    )
  );
}

const shadowRoot = getOrCreateExtensionRoot();
let reactMount = shadowRoot.getElementById("section-nav-react-root");

if (!(reactMount instanceof HTMLElement)) {
  reactMount = document.createElement("div");
  reactMount.id = "section-nav-react-root";
  shadowRoot.append(reactMount);
}

if (reactMount.dataset.mounted !== "true") {
  reactMount.dataset.mounted = "true";
  const reactRoot = createRoot(reactMount);
  const themeManager = new ThemeManager(shadowRoot.host as HTMLElement);
  const refreshTimerIds = new Set<number>();
  let activeAnswer: ActiveAnswer | null = null;
  let activeSectionId: string | null = null;
  let bookmarks: Bookmark[] = [];
  let conversationKey = chatgptAdapter.getConversationKey();
  let conversationVersion = 0;
  let destroyed = false;
  let drawerOpen = false;
  let railPosition: RailPosition = HIDDEN_RAIL_POSITION;
  let sections: Section[] = [];
  let unresolvedBookmarkIds = new Set<string>();
  let answerTracker: AnswerTracker;
  let conversationWatcher: ConversationWatcher;
  let routeWatcher: ConversationRouteWatcher;

  const render = () => {
    if (destroyed) {
      return;
    }

    reactRoot.render(
      <StrictMode>
        <App
          activeSectionId={activeSectionId}
          bookmarks={bookmarks}
          drawerOpen={drawerOpen}
          onBookmarkDelete={(bookmark) => {
            if (!ensureCurrentConversation()) {
              return;
            }

            const operationKey = conversationKey;
            const operationVersion = conversationVersion;

            void bookmarkService
              .remove(operationKey, bookmark.id)
              .then((nextBookmarks) => {
                updateBookmarksForContext(nextBookmarks, operationKey, operationVersion);
              })
              .catch(handleBookmarkError);
          }}
          onBookmarkSelect={(bookmark) => {
            if (!ensureCurrentConversation()) {
              return;
            }

            const targetSection = resolveBookmark(bookmark, chatgptAdapter);

            if (!targetSection) {
              unresolvedBookmarkIds = new Set(unresolvedBookmarkIds).add(bookmark.id);
              render();
              return;
            }

            unresolvedBookmarkIds = new Set(
              [...unresolvedBookmarkIds].filter((bookmarkId) => bookmarkId !== bookmark.id),
            );
            drawerOpen = false;
            activeSectionId = targetSection.id;
            render();
            navigateToSection(targetSection);
          }}
          onDrawerClose={() => {
            drawerOpen = false;
            render();
          }}
          onDrawerToggle={() => {
            if (!ensureCurrentConversation()) {
              return;
            }

            drawerOpen = !drawerOpen;
            render();
          }}
          onSectionSelect={(section) => {
            if (!ensureCurrentConversation()) {
              return;
            }

            drawerOpen = false;
            activeSectionId = section.id;
            render();
            navigateToSection(section);
          }}
          onToggleBookmark={(section) => {
            if (!ensureCurrentConversation()) {
              return;
            }

            const operationKey = conversationKey;
            const operationVersion = conversationVersion;

            void bookmarkService
              .toggle(operationKey, section)
              .then((nextBookmarks) => {
                updateBookmarksForContext(nextBookmarks, operationKey, operationVersion);
              })
              .catch(handleBookmarkError);
          }}
          position={railPosition}
          sections={sections}
          unresolvedBookmarkIds={unresolvedBookmarkIds}
        />
      </StrictMode>,
    );
  };

  const updateBookmarks = (nextBookmarks: Bookmark[]) => {
    if (destroyed) {
      return;
    }

    bookmarks = nextBookmarks;
    unresolvedBookmarkIds = new Set(
      [...unresolvedBookmarkIds].filter((bookmarkId) =>
        bookmarks.some((bookmark) => bookmark.id === bookmarkId),
      ),
    );
    render();
  };

  const handleBookmarkError = (error: unknown) => {
    if (import.meta.env.MODE === "development") {
      console.warn("[SectionNav] Bookmark storage operation failed", error);
    }
  };

  const updateBookmarksForContext = (
    nextBookmarks: Bookmark[],
    key: string,
    version: number,
  ) => {
    if (key === conversationKey && version === conversationVersion) {
      updateBookmarks(nextBookmarks);
    }
  };

  const loadBookmarks = async (key: string, version: number) => {
    try {
      const storedBookmarks = await bookmarkService.list(key);

      updateBookmarksForContext(storedBookmarks, key, version);
    } catch (error) {
      handleBookmarkError(error);
    }
  };

  const positionManager = new PositionManager({
    onPositionChange(position) {
      railPosition = position;
      render();
    },
  });

  const sectionTracker = new SectionTracker({
    onActiveSectionChange(sectionId) {
      activeSectionId = sectionId;
      render();
    },
  });

  const updateActiveSections = () => {
    if (!activeAnswer?.element.isConnected) {
      return;
    }

    const nextSections = parseSections(activeAnswer.element, chatgptAdapter);

    if (sectionsEqual(sections, nextSections)) {
      return;
    }

    sections = nextSections;
    positionManager.setTarget(
      chatgptAdapter.getMessageContent(activeAnswer.element) ?? activeAnswer.element,
    );
    sectionTracker.setSections(sections);
    render();
  };

  conversationWatcher = new ConversationWatcher(chatgptAdapter, {
    onPotentialRouteChange() {
      return routeWatcher.sync();
    },
    onMutation(mutation) {
      if (routeWatcher.sync()) {
        return;
      }

      conversationWatcher.refreshContainer();

      if (mutation.messagesChanged) {
        answerTracker.refreshMessages();

        if (unresolvedBookmarkIds.size > 0) {
          unresolvedBookmarkIds = new Set();
          render();
        }
      }

      if (mutation.activeAnswerChanged) {
        updateActiveSections();
      }
    },
  });

  answerTracker = new AnswerTracker(chatgptAdapter, {
    onActiveAnswerChange(nextActiveAnswer) {
      activeAnswer = nextActiveAnswer;
      conversationWatcher.setActiveAnswer(activeAnswer?.element ?? null);
      sections = activeAnswer ? parseSections(activeAnswer.element, chatgptAdapter) : [];
      positionManager.setTarget(
        activeAnswer
          ? (chatgptAdapter.getMessageContent(activeAnswer.element) ?? activeAnswer.element)
          : null,
      );
      sectionTracker.setSections(sections);

      if (import.meta.env.MODE === "development") {
        console.info("[SectionNav] Active answer sections", {
          activeAnswerId: activeAnswer
            ? chatgptAdapter.getMessageId(activeAnswer.element)
            : null,
          sections,
        });
      }

      render();
    },
  });

  const clearRefreshTimers = () => {
    for (const timerId of refreshTimerIds) {
      window.clearTimeout(timerId);
    }

    refreshTimerIds.clear();
  };

  const scheduleMessageRefreshes = () => {
    clearRefreshTimers();

    for (const delay of INITIAL_REFRESH_DELAYS) {
      const timerId = window.setTimeout(() => {
        refreshTimerIds.delete(timerId);

        if (routeWatcher.sync()) {
          return;
        }

        conversationWatcher.refreshContainer();
        answerTracker.refreshMessages();
      }, delay);

      refreshTimerIds.add(timerId);
    }
  };

  const resetForConversation = (nextConversationKey: string) => {
    conversationVersion += 1;
    conversationKey = nextConversationKey;
    activeAnswer = null;
    activeSectionId = null;
    bookmarks = [];
    drawerOpen = false;
    railPosition = HIDDEN_RAIL_POSITION;
    sections = [];
    unresolvedBookmarkIds = new Set();
    conversationWatcher.setActiveAnswer(null);
    answerTracker.reset();
    positionManager.setTarget(null);
    sectionTracker.setSections([]);
    render();
    void loadBookmarks(conversationKey, conversationVersion);
    scheduleMessageRefreshes();
  };

  routeWatcher = new ConversationRouteWatcher(chatgptAdapter, {
    onRouteChange({ currentKey }) {
      resetForConversation(currentKey);
    },
  });

  const ensureCurrentConversation = () => !routeWatcher.sync();

  const handleDocumentPointerDown = (event: PointerEvent) => {
    const interactionInsideExtension = event.composedPath().includes(shadowRoot.host);

    if (interactionInsideExtension && !ensureCurrentConversation()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (drawerOpen && !interactionInsideExtension) {
      drawerOpen = false;
      render();
    }
  };

  const handleDocumentKeyDown = (event: KeyboardEvent) => {
    if (event.composedPath().includes(shadowRoot.host) && !ensureCurrentConversation()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (drawerOpen && event.key === "Escape") {
      drawerOpen = false;
      render();
    }
  };

  const handleDocumentClick = () => {
    routeWatcher.sync();
  };

  positionManager.start();
  themeManager.start();
  sectionTracker.start();
  conversationWatcher.start();
  answerTracker.start();
  routeWatcher.start();
  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("pointerdown", handleDocumentPointerDown, true);
  document.addEventListener("keydown", handleDocumentKeyDown);
  void loadBookmarks(conversationKey, conversationVersion);
  scheduleMessageRefreshes();

  const handlePageHide = (event: PageTransitionEvent) => {
    if (event.persisted || destroyed) {
      return;
    }

    destroyed = true;
    clearRefreshTimers();
    document.removeEventListener("click", handleDocumentClick);
    document.removeEventListener("pointerdown", handleDocumentPointerDown, true);
    document.removeEventListener("keydown", handleDocumentKeyDown);
    window.removeEventListener("pagehide", handlePageHide);
    routeWatcher.destroy();
    conversationWatcher.destroy();
    answerTracker.destroy();
    positionManager.destroy();
    sectionTracker.destroy();
    themeManager.destroy();
    reactRoot.unmount();
  };

  window.addEventListener("pagehide", handlePageHide);
}
