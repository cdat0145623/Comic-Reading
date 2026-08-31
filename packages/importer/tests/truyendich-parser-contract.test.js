import assert from "node:assert/strict";
import test from "node:test";

import { parseStoryPayload } from "../infrastructure/sources/truyendich/parsers/story-parser.js";
import { mapCatalogChapter, parseCatalogPage } from "../infrastructure/sources/truyendich/parsers/catalog-parser.js";
import { parseChapterHtml } from "../infrastructure/sources/truyendich/parsers/chapter-parser.js";

test("story parser validates a source payload without network access", () => {
    const story = parseStoryPayload({
        id: 1,
        title: "Story",
        slug: "story",
        latest_chapter_number: 1,
        editions: [{ id: 1, edition_name: "ai" }],
    });
    assert.equal(story.title, "Story");
});

test("catalog parser normalizes chapter data", () => {
    const page = parseCatalogPage({
        total: 1,
        page: 1,
        size: 200,
        items: [{ id: 10, chapter_number: 1, title: null }],
    }, 1);
    assert.equal(mapCatalogChapter(page.items[0], "https://source.test/story").title, "Chương 1");
});

test("chapter parser rejects mismatched metadata", () => {
    assert.throws(
        () => parseChapterHtml("<html></html>", {
            expectedChapterNumber: 1,
            expectedEditionExternalId: 1,
            expectedEditionName: "ai",
            sourceUrl: "https://source.test/chapter",
        }),
        (error) => error.code === "SOURCE_CHAPTER_METADATA_INVALID",
    );
});
