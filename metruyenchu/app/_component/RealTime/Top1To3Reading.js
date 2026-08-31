import { UserIcon } from "@heroicons/react/20/solid";
import { Square3Stack3DIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import Image from "next/image";

function Top1To3Reading({ story, index }) {
    console.log("Top1To3Reading::::", story, index);
    if (!story)
        return <p className="text-center italic text-sm">Chưa có dữ liệu.</p>;

    const rankIcons = {
        1: "/rank_1.png",
        2: "/rank_2.png",
        3: "/rank_3.png",
    };
    const {
        title,
        stringUrl,
        introduce,
        author,
        tag,
        totalChapters,
        readerCount,
    } = story;

    return (
        <div className="grid grid-cols-1 gap-6">
            <div className="flex space-x-3 pb-6 border-b border-slate-200">
                <div className="flex-shrink-0">
                    <Link href="#">
                        <Image
                            src={stringUrl}
                            width={96}
                            height={136}
                            alt={title}
                            className="shadow-xl rounded custom-image-height"
                        />
                    </Link>
                </div>

                <div className="flex-grow space-y-2">
                    <div className="flex items-center space-x-2 justify-between">
                        <div className="flex items-center space-x-2">
                            <div>
                                <Image
                                    src={rankIcons[index + 1]}
                                    width={24}
                                    height={24}
                                    alt=""
                                    className="w-6 h-6"
                                />
                            </div>
                            <Link href="#" className="font-semibold text-sm">
                                {title}
                            </Link>
                        </div>
                        <div>
                            <span className="sm:text-sm text-xs text-primary">{`${readerCount} người đang đọc`}</span>
                        </div>
                    </div>
                    <div className="text-sm text-gray-500 text-overflow-multiple-lines">
                        {introduce}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                        <div className="flex space-x-1 items-center">
                            <UserIcon className="w-4 h-4 text-gray-500" />

                            <span className="text-xs">{author}</span>
                        </div>
                        <span className="text-xs">
                            {`${totalChapters} chương`}{" "}
                        </span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                        <div className="flex space-x-1 text-gray-500">
                            <Square3Stack3DIcon className="w-4 h-4" />

                            <span className="text-xs">{tag}</span>
                        </div>
                        <button className="px-2 py-1 bg-primary text-white text-xs rounded-md">
                            Đọc thử
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Top1To3Reading;
