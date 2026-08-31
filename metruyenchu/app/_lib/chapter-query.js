function getChapterNumberParam(number) {
    return typeof number === "number" ? `chuong-${number}` : number;
}

function getChapterDetailQueryKey({ slug, number }) {
    return ["chapterDetail", slug, getChapterNumberParam(number)];
}

function getChapterHref({ slug, number }) {
  return `/truyen/${slug}/${getChapterNumberParam(number)}`;
}

function getChapterBenchmarkPolicy(value) {
  const variant = value === "baseline" ? "baseline" : "tanstack";
  const useTanStack = variant === "tanstack";

  return {
    variant,
    serverPrefetch: useTanStack,
    queryCache: useTanStack,
    navigationPrefetch: useTanStack,
  };
}

export {
  getChapterBenchmarkPolicy,
  getChapterDetailQueryKey,
  getChapterHref,
  getChapterNumberParam,
};
