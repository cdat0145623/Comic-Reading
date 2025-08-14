import Image from "next/image";
import Link from "next/link";

function RecentlyCompletedCard({ story }) {
    const { stringUrl, title } = story;
    return (
        <div className="flex flex-col mx-auto space-y-2 h-auto">
            <Link href="#" className="block w-full">
                <div className="aspect-[3/4] relative">
                    <Image
                        src={stringUrl}
                        alt={title}
                        fill
                        className="rounded shadow-sm object-cover"
                    />
                </div>
            </Link>
            <Link
                href="#"
                className="text-xs font-semibold text-title-color hover:text-primary text-center"
            >
                <span>{title}</span>
            </Link>
        </div>
    );
}

export default RecentlyCompletedCard;
