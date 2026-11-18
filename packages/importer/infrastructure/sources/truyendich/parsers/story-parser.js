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

function slugifySourceLabel(value) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export function parsePublicStoryPage(html, { source, activeOrigin }) {
    const $ = cheerio.load(html);
    const structuredData = $('script[type="application/ld+json"]')
        .map((_, element) => {
            try {
                return JSON.parse($(element).html() || "");
            } catch {
                return null;
            }
        })
        .get()
        .find((item) => item?.["@type"] === "Book");
    const decodedPayload = html.replaceAll('\\"', '"');
    const catalogMatch = decodedPayload.match(
        /"initialData":(\{"total":\d+,"page":\d+,"size":\d+,"items":\[.*?\]}),"slug":/s,
    );
    const novelIdMatch = decodedPayload.match(/"novelId":(\d+),"novelSlug":/);
    if (!structuredData || !catalogMatch || !novelIdMatch) {
        throw new ImportDiscoveryError(
            "SOURCE_SCHEMA_CHANGED",
            "Website nguồn đã thay đổi cấu trúc trang truyện công khai.",
            { category: "SOURCE" },
        );
    }
    let catalogPage;
    try {
        catalogPage = parseCatalogPage(JSON.parse(catalogMatch[1]), 1);
    } catch (error) {
        if (error instanceof ImportDiscoveryError) throw error;
        throw new ImportDiscoveryError(
            "SOURCE_SCHEMA_CHANGED",
            "Website nguồn đã thay đổi dữ liệu catalog trên trang truyện.",
            { cause: error, category: "SOURCE" },
        );
    }
    const categoryNames = String(structuredData.genre || "")
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean);
    const editionNames = ["ai"];
    const convertPath = `/doc-truyen/cv/${source.sourceSlug}`;
    if ($(`a[href="${convertPath}"], a[href="${convertPath}/"]`).length) {
        editionNames.push("convert");
    }
    const pageText = $("body").text().replace(/\s+/g, " ");
    const sourceStatus =
        pageText.match(/Trạng thái\s*(Đang ra|Hoàn thành|Tạm dừng)/i)?.[1] || null;
    const novelId = novelIdMatch[1];
    const storyPayload = {
        id: novelId,
        title: String(structuredData.name || "").trim(),
        slug: source.sourceSlug,
        image_url: structuredData.image || null,
        status: sourceStatus,
        author:
            typeof structuredData.author === "object"
                ? structuredData.author?.name || null
                : structuredData.author || null,
        latest_chapter_number: catalogPage.total,
        description: structuredData.description || "",
        categories: categoryNames.map((name) => ({
            id: `html:${novelId}:category:${slugifySourceLabel(name)}`,
            name,
            slug: slugifySourceLabel(name),
        })),
        editions: editionNames.map((name) => ({
            id: `html:${novelId}:edition:${name}`,
            edition_name: name,
            first_chapter_slug: "1",
        })),
    };
    return {
        storyPayload: parseStoryPayload(storyPayload),
        catalogPage,
        activeOrigin,
    };
}

export { parseCatalogPage };
