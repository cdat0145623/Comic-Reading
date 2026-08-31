"use client";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { Square3Stack3DIcon } from "@heroicons/react/24/outline";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import NavigationLink from "../../NavigationLink";

function timeAgo(time) {
    return formatDistanceToNow(new Date(time), { addSuffix: true, locale: vi });
}

function ChapterCard({ story, index }) {
    if (!story)
        return <p className="text-center text-sm italic">Chưa có dữ liệu</p>;

    const {
        slug,
        author,
        content,
        name,
        number,
        postedAt,
        title,
        user,
        totalChapters,
        tags,
        tag,
    } = story;

    // const {}
    return (
        <div
            className={`grid grid-cols-12 px-2 py-3 gap-2 ${
                (index - 1) % 2 === 0 ? "bg-slate-100" : ""
            }`}
        >
            <div className="col-span-12 sm:col-span-8 md:col-span-7 lg:col-span-6">
                <NavigationLink
                    href={`/truyen/${slug}`}
                    className="text-sm text-title-color font-medium hover:text-primary"
                >
                    {title}
                </NavigationLink>
            </div>

            <div className="flex items-center col-span-6 space-x-1 sm:hidden md:block md:col-span-2 lg:col-span-2">
                <UserCircleIcon className="w-3 h-3 md:hidden lg:hidden" />
                <span className="text-gray-500 text-xs md:truncate lg:truncate">
                    {author ? author : tags.find((tag) => tag.id === 1)?.label}
                </span>
            </div>
            <div className="col-span-6 flex items-center justify-self-end sm:col-span-2 md:col-span-2 md:justify-self-start lg:col-span-2 lg:justify-self-start">
                <span className="text-gray-500 text-xs col-span-6">
                    {number ? `Chương ${number}` : `${totalChapters} chương`}
                </span>
            </div>
            <div className="flex items-center col-span-6 space-x-1 sm:hidden md:hidden lg:block lg:order-first lg:col-span-1">
                <Square3Stack3DIcon className="w-3 h-3 lg:hidden" />
                <span className="text-gray-500 text-xs lg:truncate">
                    {tag
                        ? `${tag}`
                        : tags?.find((tag) => tag.groupId === 5)?.label}
                </span>
            </div>

            <div className="flex justify-self-end items-center col-span-6 sm:col-span-2 md:col-span-1 lg:col-span-1">
                <span className="text-gray-500 text-xs truncate">
                    {postedAt ? timeAgo(postedAt) : user}
                </span>
            </div>
        </div>
    );
}

export default ChapterCard;
