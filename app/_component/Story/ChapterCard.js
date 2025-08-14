"use client";
import Link from "next/link";
import { LockClosedIcon } from "@heroicons/react/24/solid";
import { timeAgo } from "@/app/_lib/helper";

function ChapterCard({ chapter, slug }) {
    const { number, name, postedAt } = chapter;
    return (
        <Link
            href={`/truyen/${slug}/chuong-${number}`}
            className="col-span-1 space-y-1 pb-2 border-b text-primary border-slate-200"
        >
            <div className="font-medium md:text-base text-sm truncate">
                {name}
            </div>
            <div className="flex items-center text-gray-400">
                <span className="text-xs">{timeAgo(postedAt)}</span>
            </div>
        </Link>
    );
}

export default ChapterCard;
