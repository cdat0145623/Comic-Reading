import { createHash } from "node:crypto";

export function normalizeChapterContent(value) {
    return String(value || "")
        .normalize("NFC")
        .replace(/\r\n?/g, "\n")
        .replace(/\u00a0/g, " ")
        .split("\n")
        .map((line) => line.replace(/[^\S\n]+/g, " ").trim())
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

export function hashChapterContent(value) {
    return createHash("sha256")
        .update(normalizeChapterContent(value), "utf8")
        .digest("hex");
}

export function countChapterWords(value) {
    const normalized = normalizeChapterContent(value);
    return normalized ? normalized.split(/\s+/u).length : 0;
}
