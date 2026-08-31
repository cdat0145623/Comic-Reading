import { z } from "zod";

import { ImportDiscoveryError } from "../../../../domain/errors.js";

const chapterSchema = z.object({
    id: z.union([z.number(), z.string()]),
    chapter_number: z.number().int().positive(),
    title: z.string().nullable().optional(),
    status: z.string().nullable().optional(),
    update_time: z.string().trim().min(1).nullable().optional(),
});

const catalogPageSchema = z.object({
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    size: z.number().int().positive(),
    items: z.array(chapterSchema),
});

export function parseSourceDate(value) {
    if (!value) return null;
    const normalizedValue = /(?:Z|[+-]\d{2}:\d{2})$/.test(value)
        ? value
        : `${value}Z`;
    const date = new Date(normalizedValue);
    return Number.isNaN(date.getTime()) ? null : date;
}

export function mapCatalogChapter(item, canonicalUrl) {
    return {
        externalChapterId: String(item.id),
        number: item.chapter_number,
        title: item.title?.trim() || `Chương ${item.chapter_number}`,
        sourceStatus: item.status || null,
        sourceUpdatedAt: parseSourceDate(item.update_time),
        sourceUrl: `${canonicalUrl}/chuong-${item.chapter_number}`,
    };
}

export function parseCatalogPage(data, page) {
    try {
        return catalogPageSchema.parse(data);
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw new ImportDiscoveryError(
                "SOURCE_SCHEMA_CHANGED",
                page === 1
                    ? "Website nguồn đã thay đổi cấu trúc catalog chương."
                    : `Website nguồn đã thay đổi cấu trúc catalog ở trang ${page}.`,
                { cause: error, category: "SOURCE" },
            );
        }
        throw error;
    }
}

export function mapCatalogChapters(items, canonicalUrl) {
    return items
        .map((item) => mapCatalogChapter(item, canonicalUrl))
        .sort((left, right) => left.number - right.number);
}
