"use client";
import { UserIcon } from "@heroicons/react/20/solid";
import Image from "next/image";
import Link from "next/link";
function RecommendCard({ story }) {
    const { title, content, stringUrl, tag, author, slug } = story;
    return (
        <>
            <div className="flex pt-3 px-3 space-x-3 mb-8 mr-5 col-span-1">
                <div className="flex-shrink-0">
                    <Link href={`/truyen/${slug}`}>
                        <Image
                            src={stringUrl}
                            alt={`Hinh anh cua truyen ${title}`}
                            width={96}
                            height={128}
                            className="rounded"
                        />
                    </Link>
                </div>
                <div className="flex flex-wrap space-y-2">
                    <Link
                        href={`/truyen/${slug}`}
                        className="w-full hover:text-primary"
                    >
                        <span className="text-title-color font-semibold">
                            {title}
                        </span>
                    </Link>
                    <div>
                        <span className="text-overflow-multiple-lines text-gray-500">
                            {content}
                        </span>
                    </div>
                    <div className="flex space-x-2 mt-1 items-center justify-between w-full">
                        <div className="flex items-center space-x-1 text-gray-500">
                            <UserIcon className="w-4 h-4" />
                            <Link href="#">
                                <span className="text-sm hover:text-primary text-gray-600">
                                    {author}
                                </span>
                            </Link>
                        </div>
                        {tag ? (
                            <Link
                                href="#"
                                className="px-2 py-1 text-primary outline-1 rounded text-xs"
                            >
                                {tag}
                            </Link>
                        ) : (
                            ""
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default RecommendCard;
