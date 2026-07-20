import Link from "next/link";
import { ChevronLeftIcon } from "@heroicons/react/16/solid";
import { ChevronRightIcon } from "@heroicons/react/16/solid";

function Chapter({ chapter }) {
    const { title, slug, author, chapters } = chapter;
    return (
        <>
            <div className="mx-2 py-3">
                <h1 className="text-lg text-center">
                    <Link
                        href={`/truyen/${slug}`}
                        className="font-semibold hover:text-primary"
                    >
                        {title}
                    </Link>
                </h1>
                <h3
                    className="text-xs text-center"
                    style={{ color: "var(--app-muted)" }}
                >
                    {author?.name}
                </h3>
            </div>
            <div className="px-2 space-x-2 flex items-center justify-center text-sm">
                <button className="flex items-center justify-center">
                    <ChevronLeftIcon className="stroke-2 w-4 h-4 ring-2 ring-primary rounded-full text-primary font-bold" />
                </button>
                <div>
                    <h2 style={{ color: "var(--app-muted)" }}>
                        {chapters[0]?.name}
                    </h2>
                </div>
                <button className="flex items-center justify-center">
                    <ChevronRightIcon className="w-4 h-4 ring-2 ring-primary rounded-full text-primary font-bold" />
                </button>
            </div>
        </>
    );
}

export default Chapter;
