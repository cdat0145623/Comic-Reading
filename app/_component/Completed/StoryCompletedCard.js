import Image from "next/image";
import Link from "next/link";
import { UserIcon } from "@heroicons/react/20/solid";
import { Square3Stack3DIcon } from "@heroicons/react/20/solid";

function StoryCompletedCard({ story }) {
    const { author, title, totalChapters, tag, stringUrl, introduce } = story;

    return (
        <div className="flex space-x-3 border-b pb-6 border-slate-200">
            <div className="flex-shrink-0">
                <Link href="#">
                    <Image
                        width={96}
                        height={128}
                        className="h-32 w-24 shadow-xl rounded"
                        src={stringUrl}
                        alt={`${title}`}
                    />
                </Link>
            </div>

            <div className="flex flex-col flex-grow space-y-2">
                <div className="text-sm">
                    <Link href="#" className="font-medium">
                        {title}
                    </Link>
                </div>
                <div className="text-overflow-multiple-lines text-gray-500 text-sm">
                    <span>{introduce}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1">
                        <UserIcon className="w-4 h-4 text-gray-500" />

                        <span>{author}</span>
                    </div>
                    <span>{`${totalChapters} chương`} </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1">
                        <Square3Stack3DIcon className="w-4 h-4 text-gray-500" />

                        <span>{tag}</span>
                    </div>
                    <button className="py-1 px-2 bg-primary text-white rounded-md">
                        Đọc thử
                    </button>
                </div>
            </div>
        </div>
    );
}

export default StoryCompletedCard;
