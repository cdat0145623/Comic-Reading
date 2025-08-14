import { ChevronDoubleRightIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import Link from "next/link";
function SectionLink({
    title,
    href,
    icon = false,
    primary = false,
    className = "",
    background = false,
    text = false,
    author = false,
    uploader = false,
}) {
    return (
        <>
            {href === "/danh-sach" ? (
                <div className="lg:px-0 px-4 flex items-center justify-between">
                    <h2 className="text-primary uppercase text-sm">{title}</h2>
                    <Link
                        href={href}
                        className="px-2 py-1 bg-primary text-white rounded uppercase text-xs"
                    >
                        Lọc Truyện
                    </Link>
                </div>
            ) : href && !background ? (
                <Link
                    href={href}
                    className="flex justify-between items-center flex-1 basis-full p-3 lg:p-1 mb-3 text-primary"
                >
                    <h2 className="uppercase text-primary">{title}</h2>
                    {icon && <ChevronDoubleRightIcon className="w-4 h-4" />}
                </Link>
            ) : (
                <div
                    className={`${clsx(
                        "flex items-center justify-between",
                        background && "bg-secondary",
                        text && "text-xs text-gray-600"
                    )}`}
                >
                    <h2
                        className={`${clsx(
                            "uppercase",
                            primary && "text-primary"
                        )} ${className}`}
                    >
                        {title}
                        {(author || uploader) && (
                            <span className="font-semibold uppercase ml-1">
                                {author || uploader}
                            </span>
                        )}
                    </h2>

                    {href ? (
                        <Link
                            href={href}
                            className="flex space-x-1 items-center pr-3"
                        >
                            <span>{text}</span>
                            {icon && (
                                <ChevronDoubleRightIcon className="w-3 h-3" />
                            )}
                        </Link>
                    ) : (
                        icon && (
                            <button className="flex items-center text-xs pr-3 space-x-1 text-gray-800">
                                <span>{text}</span>
                                <ChevronDoubleRightIcon className="w-3 h-3" />
                            </button>
                        )
                    )}
                </div>
            )}
        </>
    );
}

export default SectionLink;
