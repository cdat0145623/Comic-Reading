import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
    parsePublicStoryPage,
    parseStoryPayload,
} from "../infrastructure/sources/truyendich/parsers/story-parser.js";
import {
    mapCatalogChapter,
    mapCatalogChapters,
    parseCatalogPage,
} from "../infrastructure/sources/truyendich/parsers/catalog-parser.js";
import { parseChapterHtml } from "../infrastructure/sources/truyendich/parsers/chapter-parser.js";

const fixtureUrl = (name) =>
    new URL(
        `../infrastructure/sources/truyendich/fixtures/${name}`,
        import.meta.url,
    );

async function readFixture(name) {
    return readFile(fixtureUrl(name), "utf8");
}

test("story parser validates the API fixture without network access", async () => {
    const story = parseStoryPayload(
        JSON.parse(await readFixture("story-api.json")),
    );
    assert.equal(story.title, "Fixture Story");
    assert.equal(story.editions[0].edition_name, "ai");
});

test("story parser maps the public HTML fixture", async () => {
    const result = parsePublicStoryPage(await readFixture("story-public.html"), {
        source: { sourceSlug: "fixture-story" },
        activeOrigin: "https://truyendich.live",
    });
    assert.equal(result.storyPayload.id, "1");
    assert.equal(result.storyPayload.latest_chapter_number, 2);
    assert.deepEqual(
        result.storyPayload.editions.map((edition) => edition.edition_name),
        ["ai", "convert"],
    );
    assert.equal(result.catalogPage.items.length, 2);
});

test("catalog parser preserves pagination and sorts mapped fixture chapters", async () => {
    const pageOne = parseCatalogPage(
        JSON.parse(await readFixture("catalog-page-1.json")),
        1,
    );
    const pageTwo = parseCatalogPage(
        JSON.parse(await readFixture("catalog-page-2.json")),
        2,
    );
    const chapters = mapCatalogChapters(
        [...pageTwo.items, ...pageOne.items],
        "https://source.test/story",
    );
    assert.equal(pageOne.page, 1);
    assert.equal(pageTwo.page, 2);
    assert.deepEqual(
        chapters.map((chapter) => chapter.number),
        [1, 2],
    );
    assert.equal(chapters[0].title, "Chương một");
    assert.equal(
        mapCatalogChapter(pageOne.items[0], "https://source.test/story").sourceUrl,
        "https://source.test/story/chuong-1",
    );
});

test("chapter parser validates AI and convert fixtures", async () => {
    const ai = parseChapterHtml(await readFixture("chapter-ai.html"), {
        expectedChapterNumber: 1,
        expectedEditionExternalId: 10,
        expectedEditionName: "ai",
        sourceUrl: "https://source.test/story/chuong-1",
    });
    const convert = parseChapterHtml(
        await readFixture("chapter-convert.html"),
        {
            expectedChapterNumber: 1,
            expectedEditionExternalId: 20,
            expectedEditionName: "convert",
            sourceUrl: "https://source.test/story/convert/chuong-1",
        },
    );
    assert.equal(ai.content, "Nội dung fixture.");
    assert.equal(ai.imageCount, 1);
    assert.match(ai.warnings[0], /1 ảnh/);
    assert.equal(convert.editionName, "convert");
    assert.equal(convert.content, "Nội dung convert fixture.");
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

test("parser contracts keep public schema and mismatch errors", async () => {
    assert.throws(
        () =>
            parseStoryPayload({
                id: 1,
                title: "Story",
                slug: "story",
                editions: [],
            }),
        (error) => error.code === "SOURCE_SCHEMA_CHANGED",
    );
    assert.throws(
        () =>
            parseChapterHtml(
                "<script>\"chapter\":{\"id\":101,\"chapter_number\":2,\"title\":\"Chương hai\",\"novel_edition_id\":10,\"edition_name\":\"ai\"}</script><div id=\"original-content-tab\"><p>Body</p></div>",
                {
                    expectedChapterNumber: 1,
                    expectedEditionExternalId: 10,
                    expectedEditionName: "ai",
                    sourceUrl: "https://source.test/chapter",
                },
            ),
        (error) => error.code === "SOURCE_CHAPTER_MISMATCH",
    );
    assert.throws(
        () =>
            parseChapterHtml(
                "<script>\"chapter\":{\"id\":101,\"chapter_number\":1,\"title\":\"Chương một\",\"novel_edition_id\":20,\"edition_name\":\"convert\"}</script><div id=\"original-content-tab\"><p>Body</p></div>",
                {
                    expectedChapterNumber: 1,
                    expectedEditionExternalId: 10,
                    expectedEditionName: "ai",
                    sourceUrl: "https://source.test/chapter",
                },
            ),
        (error) => error.code === "SOURCE_EDITION_MISMATCH",
    );
});
