export type SectionLevel = 1 | 2 | 3;

export interface Section {
  answerFingerprint: string;
  answerKey: string;
  depth: number;
  element: HTMLHeadingElement;
  id: string;
  index: number;
  key: string;
  level: SectionLevel;
  text: string;
}

export interface Bookmark {
  answerFingerprint?: string;
  answerKey: string;
  conversationKey: string;
  createdAt: number;
  id: string;
  note?: string;
  sectionIndex: number;
  sectionKey: string;
  sectionLevel: SectionLevel;
  sectionText: string;
}
