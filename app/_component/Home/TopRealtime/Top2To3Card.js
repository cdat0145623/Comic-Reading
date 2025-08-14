import Image from "next/image";

function Top2To3Card({ story, rank }) {
    const rankUrl = rank === 2 ? "/rank_2.png" : "/rank_3.png";
    return (
        <div className="flex p-3 space-x-2 items-center">
            <div className="flex-shrink-0">
                <Image
                    src={rankUrl}
                    width={24}
                    height={24}
                    quality={80}
                    alt="top 1 of ...."
                />
            </div>
            <a href="#" className="w-full">
                <span className="text-title-color text-sm hover:text-primary">
                    {story.title}
                </span>
            </a>
            <div>
                <span className="text-gray-500 text-sm">
                    {story.readerCount}
                </span>
            </div>
        </div>
    );
}

export default Top2To3Card;
