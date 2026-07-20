import {
    dehydrate,
    HydrationBoundary,
    QueryClient,
} from "@tanstack/react-query";
import StoryCatalog from "./StoryCatalog";
import {
    STORY_CATALOG_PAGE_SIZE,
    STORY_CATALOG_STALE_TIME,
    canonicalizeCatalogFilters,
    storyCatalogKeys,
} from "@/app/_lib/story-catalog-query";
import {
    getStoryCatalog,
    getStoryCatalogFilterGroups,
} from "@/app/_lib/story-catalog-service";

export const metadata = {
    title: "Khám phá truyện",
    description: "Tìm và lọc truyện theo thể loại, trạng thái và lượt đọc.",
};

export default async function ExplorePage({ searchParams }) {
    const filters = canonicalizeCatalogFilters(await searchParams);
    const [filterGroups] = await Promise.all([getStoryCatalogFilterGroups()]);
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { staleTime: STORY_CATALOG_STALE_TIME },
        },
    });

    await queryClient.prefetchInfiniteQuery({
        queryKey: storyCatalogKeys.list(filters),
        queryFn: ({ pageParam }) =>
            getStoryCatalog({
                filters,
                cursor: pageParam,
                pageSize: STORY_CATALOG_PAGE_SIZE,
            }),
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        staleTime: STORY_CATALOG_STALE_TIME,
    });

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <StoryCatalog initialFilters={filters} filterGroups={filterGroups} />
        </HydrationBoundary>
    );
}
