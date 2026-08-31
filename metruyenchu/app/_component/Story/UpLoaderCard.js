import Image from "next/image";
import Link from "next/link";

function UpLoaderCard({ story }) {
    const { stringUrl, title, slug } = story;
    return (
        <div className="flex flex-col space-y-2 mx-auto w-full h-full">
            <Link href={`/truyen/${slug}`} className="block w-full">
                <div className="aspect-[3/4] relative">
                    <Image
                        src={stringUrl}
                        alt={title}
                        fill
                        className="shadow-xl rounded object-cover"
                    />
                </div>
            </Link>
            <Link href={`/truyen/${slug}`} className="text-xs text-center">
                <span className="font-semibold ">{title}</span>
            </Link>
        </div>
    );
}

export default UpLoaderCard;
