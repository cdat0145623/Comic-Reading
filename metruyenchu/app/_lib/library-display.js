function getLibraryRowDisplay(item) {
    const readNumber = item?.lastChapter?.number ?? null;
    const totalChapters = Number(item?.totalChapters) || 0;
    const hasReadingProgress = Number.isInteger(readNumber) && readNumber > 0;
    const hasChapters = totalChapters > 0 && Boolean(item?.latestChapter);

    return {
        hasChapters,
        hasReadingProgress,
        progress:
            hasReadingProgress && totalChapters > 0
                ? Math.min(
                      100,
                      Math.round((readNumber / totalChapters) * 100),
                  )
                : 0,
        readHref: hasChapters
            ? `/truyen/${item.slug}/chuong-${hasReadingProgress ? readNumber : 1}`
            : null,
        readLabel: hasReadingProgress ? "Đọc tiếp" : "Đọc từ đầu",
        readNumber,
    };
}

export { getLibraryRowDisplay };
