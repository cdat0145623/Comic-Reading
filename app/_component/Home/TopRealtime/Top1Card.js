import { UserCircleIcon } from "@heroicons/react/24/outline";
import { Square3Stack3DIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import Image from "next/image";

function Top1Card({ story }) {
    const { title, stringUrl, author, tag, readerCount } = story;
    return (
        <div className="grid">
            <div className="flex space-x-2 p-3">
                <div className="flex-shrink-0">
                    <Image
                        src="/rank_1.png"
                        width={24}
                        height={24}
                        quality={80}
                        alt="top 1 of ...."
                    />
                </div>
                <div className="w-full relative">
                    <Link href="#">
                        <span className="text-title-color text-sm font-semibold hover:text-primary">
                            {title}
                        </span>
                    </Link>
                    <div className="flex text-primary items-center space-x-2 my-2">
                        <span className="text-sm font-semibold mr-1">
                            {readerCount}
                        </span>{" "}
                        người đang đọc
                    </div>
                    <div className="text-gray-500 absolute bottom-0 left-0 space-y-1">
                        <div className="flex space-x-1 items-center">
                            <UserCircleIcon className="w-4 h-4" />
                            <span className="text-xs">{author}</span>
                        </div>
                        <div className="flex space-x-1 items-center">
                            <Square3Stack3DIcon className="w-4 h-4" />
                            <span className="text-xs">{tag}</span>
                        </div>
                    </div>
                </div>
                <div className="book-cover">
                    <Link href="#" className="">
                        <div className="book-cover-link w-[65px] h-[100px]">
                            <Image
                                fill
                                className="object-cover"
                                src={stringUrl}
                                alt={`truyen ${title}`}
                            />
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default Top1Card;
