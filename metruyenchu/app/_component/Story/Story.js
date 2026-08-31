"use client";
import Image from "next/image";
import Link from "next/link";
import { ListBulletIcon } from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/outline";
import { ChatBubbleBottomCenterTextIcon } from "@heroicons/react/24/outline";
import { FlagIcon } from "@heroicons/react/24/outline";
import { selectedTag } from "@/app/_lib/helper";
import ChapterCatalogButton from "./ChapterCatalog/ChapterCatalogButton";
import ContinueReadingButton from "./ContinueReadingButton";
import StoryBookmarkButton from "./StoryBookmarkButton";
import { useState } from "react";
import { getCatalogHrefForTag } from "@/app/_lib/story-catalog-query";
import NavigationLink from "../NavigationLink";

function Story({ story, slug }) {
    const { id, title, author, stats, tags, stringUrl, totalChapters } = story;
    const [bookmarkCount, setBookmarkCount] = useState(
        stats?.totalBookmarks ?? 0,
    );

    return (
        <div className="flex md:flex-row flex-col">
            <div className="md:mr-6 md:mb-0 mb-4 mx-auto flex flex-col">
                <div className="flex-shrink-0 mb-3">
                    <Link href={slug}>
                        <Image
                            src={stringUrl}
                            alt={title}
                            className="shadow-lg rounded"
                            width={176}
                            height={240}
                        />
                    </Link>
                </div>

                <div className="flex items-center justify-center">
                    <button className="flex items-center justify-center space-x-2 text-gray-400 hover:text-primary">
                        <FlagIcon className="h-5 w-5" />
                        <span className="text-sm">Báo cáo</span>
                    </button>
                </div>
            </div>

            <div className="flex-grow mb-4 mx-auto md:text-left text-center">
                <h1 className="mb-2">
                    <Link href={slug} className="font-semibold text-lg">
                        {title}
                    </Link>
                </h1>

                <div className="mb-6">
                    <Link href="#" className="text-gray-500 text-sm">
                        {author?.name}
                    </Link>
                </div>

                <div className="md:mb-8 mb-6 flex md:flex-row space-x-4 flex-col">
                    <div className="flex md:mb-0 mb-6 justify-center md:justify-start">
                        <ContinueReadingButton
                            storyId={id}
                            slug={slug}
                            className="flex items-center border border-white px-2 py-1 bg-rose-700 text-white text-sm space-x-2 rounded"
                        />
                    </div>

                    <div className="flex space-x-4 items-center justify-center">
                        <StoryBookmarkButton
                            storyId={id}
                            className="flex items-center px-2 py-1 border border-gray-600 rounded text-sm space-x-2 hover:text-primary hover:border-primary"
                            label="Đánh dấu"
                            onChange={(enabled) =>
                                setBookmarkCount((count) =>
                                    Math.max(0, count + (enabled ? 1 : -1)),
                                )
                            }
                        />
                        <ChapterCatalogButton
                            storyId={id}
                            slug={slug}
                            storyTitle={title}
                            totalChapters={totalChapters}
                            className="flex items-center px-2 py-1 border border-gray-600 rounded text-sm space-x-2 hover:text-primary relative"
                        >
                            <ListBulletIcon className="w-5 h-5" />

                            <span className="sm:block hidden">Mục lục</span>
                            <span className="absolute bg-primary min-w-6 h-6 flex items-center justify-center text-white text-[10px] rounded-full -top-4 -right-4 -">
                                {totalChapters}
                            </span>
                        </ChapterCatalogButton>
                        <button className="flex items-center px-2 py-1 border border-gray-600 rounded text-sm space-x-2 hover:text-primary hover:border-primary relative">
                            <StarIcon className="w-5 h-5" />

                            <span className="sm:block hidden">Đánh giá</span>
                            <span className="absolute bg-primary min-w-6 h-6 flex items-center justify-center text-white text-[10px] rounded-full -top-4 -right-4">
                                {stats?.averageRating}
                            </span>
                        </button>
                        <button className="flex items-center px-2 py-1 border border-gray-600 rounded text-sm space-x-2 hover:text-primary hover:border-primary relative">
                            <ChatBubbleBottomCenterTextIcon className="w-5 h-5" />

                            <span className="sm:block hidden">Thảo luận</span>
                            <span className="absolute bg-primary min-w-6 h-6 flex items-center justify-center text-white text-[10px] rounded-full -top-4 -right-4">
                                {stats?.totalComments}
                            </span>
                        </button>
                    </div>
                </div>

                <div className="mb-6 flex divide-x hover:text-primary md:justify-start justify-center">
                    <div className="text-sm px-3 md:pl-0 flex flex-col items-center">
                        <span className="font-semibold">
                            {stats?.weeklyChapter}
                        </span>
                        <span>Chs/tuần</span>
                    </div>
                    <div className="text-sm px-3 flex flex-col items-center">
                        <span className="font-semibold">
                            {stats?.totalReads}
                        </span>
                        <span>Lượt đọc </span>
                    </div>
                    <div className="text-sm px-3 flex flex-col items-center">
                        <span className="font-semibold">
                            {stats?.totalVotes}
                        </span>
                        <span>Đề cử</span>
                    </div>
                    <div className="text-sm px-3 flex flex-col items-center">
                        <span className="font-semibold">
                            {bookmarkCount}
                        </span>
                        <span>Cất giữ</span>
                    </div>
                </div>

                <div className="md:leading-normal leading-10 space-x-4">
                    {selectedTag(tags)?.map((tag) => (
                        <NavigationLink
                            key={tag?.label}
                            href={getCatalogHrefForTag(tag)}
                            className={`px-2 py-1 rounded border text-xs ${tag.color}`}
                        >
                            {tag?.label}
                        </NavigationLink>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Story;
