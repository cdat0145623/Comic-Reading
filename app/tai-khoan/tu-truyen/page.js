import { getUserLibraryPage } from "@/app/_lib/library-service";
import { libraryKeys } from "@/app/_lib/library-query";
import { getUserLibrarySettings } from "@/app/_lib/data-service";
import { auth } from "@/lib/auth";
import {
    dehydrate,
    HydrationBoundary,
    QueryClient,
} from "@tanstack/react-query";
import { redirect } from "next/navigation";
import UserLibrary from "./UserLibrary";

export const metadata = { title: "Tủ truyện" };

const readingSortMap = {
    RECENTLYREAD: "recent",
    LATESTCHAPTER: "chapter",
    TITLE: "title",
};
const markedSortMap = {
    RECENTLYSAVED: "saved",
    LATESTCHAPTER: "chapter",
    TITLE: "title",
};

export default async function UserLibraryPage({ searchParams }) {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login?callbackUrl=/tai-khoan/tu-truyen");
    }

    const params = await searchParams;
    const settings = await getUserLibrarySettings(session.user.id);
    const tab = params?.tab === "bookmarked" ? "bookmarked" : "reading";
    const page = Math.max(1, Number(params?.page) || 1);
    const defaultSorts = {
        reading: readingSortMap[settings.sortReading] || "recent",
        bookmarked: markedSortMap[settings.sortMarked] || "saved",
    };
    const sort = params?.sort || defaultSorts[tab];
    const queryClient = new QueryClient();
    const queryKey = libraryKeys.list({
        userId: session.user.id,
        tab,
        page,
        sort,
    });

    await queryClient.prefetchQuery({
        queryKey,
        queryFn: () =>
            getUserLibraryPage({
                userId: session.user.id,
                tab,
                page,
                sort,
            }),
    });

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <UserLibrary
                userId={session.user.id}
                initialTab={tab}
                initialPage={page}
                initialSort={sort}
                defaultSorts={defaultSorts}
                initialSettings={settings}
            />
        </HydrationBoundary>
    );
}
