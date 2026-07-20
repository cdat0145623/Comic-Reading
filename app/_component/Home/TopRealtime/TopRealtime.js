"use client";
import SectionLink from "../../SectionLink";

import { fetchTopStories } from "@/app/_lib/api";
import { useFetchWithMinLoading } from "@/app/hooks/useFetchWithMinLoading";

import Spinner from "../../Spinner";
import ListRealtime from "./ListRealtime";
import { sortByReaderCount } from "@/app/_lib/helper";

function TopRealtime() {
    const { data: topStories, loading } = useFetchWithMinLoading(
        () => fetchTopStories(),
        [],
        500
    );

    return (
        <>
            <div className="col-span-1">
                <SectionLink title="Thời gian thực" href="/realtime" icon />
                {loading ? (
                    <Spinner />
                ) : (
                    <ListRealtime topStories={sortByReaderCount(topStories)} />
                )}
            </div>
        </>
    );
}

export default TopRealtime;
