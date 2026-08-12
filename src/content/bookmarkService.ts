import { hashText } from "../shared/hash";
import type { Bookmark, Section } from "../shared/types";

const STORAGE_KEY = "chatgptSectionNav.bookmarks.v1";

function isBookmark(value: unknown): value is Bookmark {
  if (!value || typeof value !== "object") {
    return false;
  }

  const bookmark = value as Partial<Bookmark>;

  return (
    typeof bookmark.id === "string" &&
    typeof bookmark.conversationKey === "string" &&
    typeof bookmark.answerKey === "string" &&
    typeof bookmark.sectionKey === "string" &&
    typeof bookmark.sectionText === "string" &&
    (bookmark.sectionLevel === 1 || bookmark.sectionLevel === 2 || bookmark.sectionLevel === 3) &&
    typeof bookmark.sectionIndex === "number" &&
    typeof bookmark.createdAt === "number"
  );
}

function createBookmark(conversationKey: string, section: Section): Bookmark {
  return {
    answerFingerprint: section.answerFingerprint,
    answerKey: section.answerKey,
    conversationKey,
    createdAt: Date.now(),
    id: `bookmark-${hashText(`${conversationKey}:${section.key}`)}`,
    sectionIndex: section.index,
    sectionKey: section.key,
    sectionLevel: section.level,
    sectionText: section.text,
  };
}

export class BookmarkService {
  private operationQueue: Promise<void> = Promise.resolve();

  async list(conversationKey: string): Promise<Bookmark[]> {
    await this.operationQueue;
    const bookmarks = await this.readAll();

    return bookmarks
      .filter((bookmark) => bookmark.conversationKey === conversationKey)
      .sort((first, second) => first.createdAt - second.createdAt);
  }

  toggle(conversationKey: string, section: Section): Promise<Bookmark[]> {
    return this.enqueue(async () => {
      const bookmarks = await this.readAll();
      const bookmarkId = `bookmark-${hashText(`${conversationKey}:${section.key}`)}`;
      const existingIndex = bookmarks.findIndex((bookmark) => bookmark.id === bookmarkId);

      if (existingIndex >= 0) {
        bookmarks.splice(existingIndex, 1);
      } else {
        bookmarks.push(createBookmark(conversationKey, section));
      }

      await this.writeAll(bookmarks);
      return bookmarks.filter((bookmark) => bookmark.conversationKey === conversationKey);
    });
  }

  remove(conversationKey: string, bookmarkId: string): Promise<Bookmark[]> {
    return this.enqueue(async () => {
      const bookmarks = (await this.readAll()).filter(
        (bookmark) => bookmark.id !== bookmarkId,
      );

      await this.writeAll(bookmarks);
      return bookmarks.filter((bookmark) => bookmark.conversationKey === conversationKey);
    });
  }

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.operationQueue.then(operation, operation);
    this.operationQueue = result.then(
      () => undefined,
      () => undefined,
    );

    return result;
  }

  private async readAll(): Promise<Bookmark[]> {
    const stored = await new Promise<Record<string, unknown>>((resolve, reject) => {
      chrome.storage.local.get(STORAGE_KEY, (result) => {
        const lastError = chrome.runtime.lastError;

        if (lastError) {
          reject(new Error(lastError.message));
          return;
        }

        resolve(result);
      });
    });
    const value: unknown = stored[STORAGE_KEY];

    return Array.isArray(value) ? value.filter(isBookmark) : [];
  }

  private writeAll(bookmarks: Bookmark[]): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [STORAGE_KEY]: bookmarks }, () => {
        const lastError = chrome.runtime.lastError;

        if (lastError) {
          reject(new Error(lastError.message));
          return;
        }

        resolve();
      });
    });
  }
}

export const bookmarkService = new BookmarkService();
