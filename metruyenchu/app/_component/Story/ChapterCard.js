"use client";
import Link from "next/link";
import { timeAgo } from "@/app/_lib/helper";
import { useSession } from "next-auth/react";
import { useModal } from "../Modal/Modal";
import { useChapterNavigation } from "@/app/hooks/useChapterNavigation";

function ChapterCard({
    chapter,
    slug,
    className = "",
    isRead = false,
    onNavigate,
}) {
    const { number, name, postedAt } = chapter;
    const { data: session } = useSession();
    const { open } = useModal();
    const { navigateToChapter } = useChapterNavigation();

    const handleClick = (e) => {
        e.preventDefault();
        if (!session) {
            open("signIn", { callbackUrl: `/truyen/${slug}/chuong-${number}` });
            return;
        }
        console.log("exit session");
        onNavigate?.();
        navigateToChapter({ slug, number });
    };

    return (
        <Link
            href={`/truyen/${slug}/chuong-${number}`}
            onClick={handleClick}
            className={`col-span-1 space-y-1 pb-2 border-b border-slate-200 ${
                isRead
                    ? "text-gray-400 bg-slate-50 border-slate-200"
                    : "text-primary"
            } ${className}`}
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
