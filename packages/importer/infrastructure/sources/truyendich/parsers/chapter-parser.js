import * as cheerio from "cheerio";

import {
    countChapterWords,
    hashChapterContent,
    normalizeChapterContent,
} from "../../../../domain/chapter-content.js";
import { ImportDiscoveryError } from "../../../../domain/errors.js";

const MAX_CHAPTER_CONTENT_SIZE = 2_000_000;

function decodeEmbeddedString(value) {
    try {
        return JSON.parse(`"${value}"`);
    } catch {
        return value.replaceAll('\\"', '"').replaceAll("\\\\", "\\");
    }
}

function extractChapterMetadata(html) {
    const decodedPayload = html.replaceAll('\\"', '"');
    const match = decodedPayload.match(
        /"chapter":\{"id":(\d+),"chapter_number":(\d+),"title":"((?:\\.|[^"\\])*)".*?"novel_edition_id":(\d+),"edition_name":"([^"]+)"/s,
    );
    if (!match) {
        throw new ImportDiscoveryError(
            "SOURCE_CHAPTER_METADATA_INVALID",
            "Không xác minh được metadata của chapter nguồn.",
        );
    }
    return {
        externalChapterId: match[1],
        number: Number(match[2]),
        title: decodeEmbeddedString(match[3]).trim(),
        editionExternalId: match[4],
        editionName: match[5].trim().toLowerCase(),
    };
}

export function chapterPathForEdition({ sourceSlug, chapterNumber, editionName }) {
    const normalizedEdition = editionName.trim().toLowerCase();
    if (normalizedEdition === "ai") {
        return `/doc-truyen/${encodeURIComponent(sourceSlug)}/chuong-${chapterNumber}`;
    }
    if (normalizedEdition === "convert") {
        return `/doc-truyen/cv/${encodeURIComponent(sourceSlug)}/chuong-${chapterNumber}`;
    }
    throw new ImportDiscoveryError(
        "UNSUPPORTED_SOURCE_EDITION",
        `Chưa hỗ trợ tải nội dung phiên bản ${editionName}.`,
    );
}

export function parseChapterHtml(
    html,
    {
        expectedChapterNumber,
        expectedEditionExternalId,
        expectedEditionName,
        sourceUrl,
    },
) {
    const metadata = extractChapterMetadata(html);
    if (metadata.number !== expectedChapterNumber) {
        throw new ImportDiscoveryError(
            "SOURCE_CHAPTER_MISMATCH",
            "Nguồn trả về sai số chương đã yêu cầu.",
        );
    }
    if (
        metadata.editionExternalId !== String(expectedEditionExternalId) ||
        metadata.editionName !== expectedEditionName.trim().toLowerCase()
    ) {
        throw new ImportDiscoveryError(
            "SOURCE_EDITION_MISMATCH",
            "Nguồn trả về sai phiên bản chapter đã chọn.",
        );
    }
    const $ = cheerio.load(html);
    const contentRoot = $("#original-content-tab").first();
    if (!contentRoot.length) {
        throw new ImportDiscoveryError(
            "SOURCE_CHAPTER_CONTENT_INVALID",
            "Không tìm thấy vùng nội dung chapter tại nguồn.",
        );
    }
    const imageCount = contentRoot.find("img").length;
    contentRoot
        .find("script, style, iframe, object, embed, noscript, svg")
        .remove();
    const paragraphs = contentRoot
        .find("p")
        .map((_, element) => normalizeChapterContent($(element).text()))
        .get()
        .filter(Boolean);
    const content = normalizeChapterContent(paragraphs.join("\n\n"));
    if (!content) {
        throw new ImportDiscoveryError(
            "SOURCE_CHAPTER_CONTENT_EMPTY",
            "Chapter nguồn không có nội dung có thể nhập.",
        );
    }
    if (Buffer.byteLength(content, "utf8") > MAX_CHAPTER_CONTENT_SIZE) {
        throw new ImportDiscoveryError(
            "SOURCE_CHAPTER_CONTENT_TOO_LARGE",
            "Nội dung chapter vượt quá giới hạn cho phép.",
        );
    }
    return {
        ...metadata,
        title: $("h1").first().text().trim() || metadata.title,
        content,
        contentHash: hashChapterContent(content),
        wordCount: countChapterWords(content),
        imageCount,
        sourceUrl,
        warnings:
            imageCount > 0
                ? [`Đã bỏ qua ${imageCount} ảnh trong nội dung nguồn.`]
                : [],
    };
}
