function getChapterNumberParam(number) {
    return typeof number === "number" ? `chuong-${number}` : number;
}

function getChapterDetailQueryKey({ slug, number }) {
    return ["chapterDetail", slug, getChapterNumberParam(number)];
}

function getChapterHref({ slug, number }) {
    return `/truyen/${slug}/${getChapterNumberParam(number)}`;
}

export { getChapterDetailQueryKey, getChapterHref, getChapterNumberParam };
