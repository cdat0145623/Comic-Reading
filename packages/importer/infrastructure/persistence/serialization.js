import { countChapterWords } from "../../domain/chapter-content.js";

export function serializeChapter(chapter) {
    return {
        id: chapter.id,
        externalChapterId: chapter.externalChapterId,
        number: chapter.number,
        title: chapter.title,
        sourceStatus: chapter.sourceStatus,
        sourceUpdatedAt:
            chapter.sourceUpdatedAt instanceof Date
                ? chapter.sourceUpdatedAt.toISOString()
                : chapter.sourceUpdatedAt || null,
        sourceUrl: chapter.sourceUrl,
    };
}

export function serializeContentDraft(chapter) {
    if (!chapter?.content || !chapter.contentHash) return null;
    return {
        id: chapter.id,
        externalChapterId: chapter.externalChapterId,
        number: chapter.number,
        title: chapter.title,
        content: chapter.content,
        contentHash: chapter.contentHash,
        wordCount: countChapterWords(chapter.content),
        imageCount: 0,
        sourceUrl: chapter.sourceUrl,
        updatedAt: chapter.updatedAt.toISOString(),
        warnings: [],
    };
}
