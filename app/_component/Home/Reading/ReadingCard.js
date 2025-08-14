import { timeAgo } from "@/app/_lib/helper";
import Link from "next/link";

function ReadingCard({ story, index }) {
    const { id, readAt, readNumber, title, totalChapters, slug } = story;
    return (
        <div className="grid" key={id}>
            <div
                className={`grid grid-cols-12 gap-2 py-3 px-3 ${
                    (index - 1) % 2 === 0 ? "bg-slate-100" : ""
                }`}
            >
                <div className="hidden md:grid md:col-span-1">
                    <span className="text-gray-500 text-xs truncate">
                        {timeAgo(readAt)}
                    </span>
                </div>
                <div className="col-span-12 md:col-span-8 sm:col-span-9 truncate">
                    <Link href={`/truyen/${slug}`}>
                        <span className="text-title-color font-semibold hover:text-primary">
                            {title}
                        </span>
                    </Link>
                </div>
                <div className="col-span-11 sm:col-span-2">
                    <span className="text-gray-500 md:text-xs text-sm truncate">
                        {`Đã đọc: ${readNumber}/${totalChapters}`}
                    </span>
                </div>
                <div className="col-span-1 justify-self-end">
                    <button className="border border-color-text rounded px-2 text-primary cursor-pointer">
                        <span className="text-xs">x</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ReadingCard;
