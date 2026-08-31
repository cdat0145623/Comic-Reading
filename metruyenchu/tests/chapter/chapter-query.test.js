import { describe, expect, it } from "vitest";

import {
  getChapterBenchmarkPolicy,
  getChapterDetailQueryKey,
  getChapterHref,
} from "../../app/_lib/chapter-query";

describe("chapter query helpers", () => {
  it("normalizes numeric chapter numbers for query keys and hrefs", () => {
    expect(
      getChapterDetailQueryKey({
        slug: "sample-story",
        number: 12,
      }),
    ).toEqual(["chapterDetail", "sample-story", "chuong-12"]);
    expect(
      getChapterDetailQueryKey({
        slug: "sample-story",
        number: "chuong-12",
      }),
    ).toEqual(["chapterDetail", "sample-story", "chuong-12"]);
    expect(getChapterHref({ slug: "sample-story", number: 12 })).toBe(
      "/truyen/sample-story/chuong-12",
    );
  });

  it("disables server, query-cache and navigation prefetch for baseline", () => {
    expect(getChapterBenchmarkPolicy("baseline")).toEqual({
      variant: "baseline",
      serverPrefetch: false,
      queryCache: false,
      navigationPrefetch: false,
    });
  });

  it("uses the TanStack strategy by default", () => {
    const expected = {
      variant: "tanstack",
      serverPrefetch: true,
      queryCache: true,
      navigationPrefetch: true,
    };

    expect(getChapterBenchmarkPolicy("tanstack")).toEqual(expected);
    expect(getChapterBenchmarkPolicy(undefined)).toEqual(expected);
    expect(getChapterBenchmarkPolicy("unexpected")).toEqual(expected);
  });
});
