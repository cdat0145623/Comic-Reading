import Image from "next/image";
import NavigationLink from "../../NavigationLink";

function RecentlyCompletedCard({ story }) {
    const { slug, stringUrl, title } = story;
    return (
        <div className="flex flex-col mx-auto space-y-2 h-auto">
            <NavigationLink href={`/truyen/${slug}`} className="block w-full">
                <div className="aspect-[3/4] relative">
                    <Image
                        src={stringUrl}
                        alt={title}
                        fill
                        className="rounded shadow-sm object-cover"
                    />
                </div>
            </NavigationLink>
            <NavigationLink
                href={`/truyen/${slug}`}
                className="text-xs font-semibold text-title-color hover:text-primary text-center"
            >
                <span>{title}</span>
            </NavigationLink>
        </div>
    );
}

export default RecentlyCompletedCard;
