"use client";
import { fetchRatings } from "@/app/_lib/api";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import FanCard from "./FanCard";

function FanList({ activeTab, storyId, fansCount }) {
    const [show, setShow] = useState(false);

    const { data } = useSuspenseQuery({
        queryKey: ["fans", storyId],
        queryFn: () => fetchRatings({ active: activeTab, storyId }),
    });

    const display = show ? data?.top : data?.top?.slice(0, 36);
    return (
        <>
            {display.map((item) => (
                <FanCard item={item} key={item.id} />
            ))}

            {!show && data?.top?.length > 50 && (
                <div className="flex items-center justify-center mt-8 col-span-full">
                    <button
                        className="w-1/4 px-4 py-2 border border-primary text-primary rounded"
                        onClick={() => setShow((prev) => !prev)}
                    >
                        Xem hết {fansCount} người hâm mộ
                    </button>
                </div>
            )}
        </>
    );
}

export default FanList;
