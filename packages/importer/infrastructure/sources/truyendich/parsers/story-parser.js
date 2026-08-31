import * as cheerio from "cheerio";
import { z } from "zod";

import { ImportDiscoveryError } from "../../../../domain/errors.js";
import { parseCatalogPage } from "./catalog-parser.js";

const editionSchema = z.object({
    id: z.union([z.number(), z.string()]),
    edition_name: z.string().min(1),
    first_chapter_slug: z.string().nullable().optional(),
});

const storySchema = z.object({
    id: z.union([z.number(), z.string()]),
    title: z.string().min(1),
    slug: z.string().min(1),
    image_url: z.string().nullable().optional(),
    status: z.string().nullable().optional(),
    author: z.string().nullable().optional(),
    latest_chapter_number: z.number().int().nonnegative(),
    description: z.string().nullable().optional(),
    categories: z.array(z.object({
        id: z.union([z.number(), z.string()]),
        name: z.string(),
        slug: z.string(),
    })).default([]),
    editions: z.array(editionSchema).min(1),
});

export function parseStoryPayload(data) {
    try {
        return storySchema.parse(data);
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw new ImportDiscoveryError(
                "SOURCE_SCHEMA_CHANGED",
                "Website nguồn đã thay đổi cấu trúc metadata truyện.",
                { cause: error, category: "SOURCE" },
            );
        }
        throw error;
    }
}

export function descriptionToText(html) {
    if (!html) return "";
    const $ = cheerio.load(`<main>${html}</main>`);
    $("script, style, iframe, object, embed").remove();
    const blockText = $("main")
        .find("p, li, h1, h2, h3, h4, blockquote")
        .map((_, element) => $(element).text().trim())
        .get()
        .filter(Boolean)
        .join("\n\n");
    return blockText || $("main").text().trim();
}

export function buildStoryDiscovery({ source, activeOrigin, storyPayload, totalChapters }) {
    const canonicalUrl = `${activeOrigin}/doc-truyen/${encodeURIComponent(source.sourceSlug)}`;
    return {
        source: {
            ...source,
            sourceOrigin: activeOrigin,
            canonicalUrl,
            externalNovelId: String(storyPayload.id),
        },
        story: {
            title: storyPayload.title.trim(),
            authorName: storyPayload.author?.trim() || "Chưa rõ tác giả",
            coverUrl: storyPayload.image_url ? new URL(storyPayload.image_url, activeOrigin).toString() : null,
            description: descriptionToText(storyPayload.description),
            sourceStatus: storyPayload.status || null,
            categories: storyPayload.categories.map((category) => ({
                externalId: String(category.id),
                name: category.name,
                slug: category.slug,
            })),
            editions: storyPayload.editions.map((edition) => ({
                externalId: String(edition.id),
                name: edition.edition_name,
                firstChapterSlug: edition.first_chapter_slug || null,
            })),
            totalChapters,
        },
        rawMetadata: storyPayload,
        canonicalUrl,
    };
}

export { parseCatalogPage };
