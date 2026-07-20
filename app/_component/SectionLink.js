import { ChevronDoubleRightIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import NavigationLink from "./NavigationLink";
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
    rightSlot = null,
}) {
    const isCatalogLink = href === "/danh-sach" || href === "/kham-pha";
    const resolvedHref = isCatalogLink ? "/kham-pha" : href;

    return (
        <>
            {isCatalogLink ? (
                <div className="lg:px-0 px-4 flex items-center justify-between">
                    <h2 className="text-primary uppercase text-sm">{title}</h2>
                    <NavigationLink
                        href={resolvedHref}
                        className="px-2 py-1 bg-primary text-white rounded uppercase text-xs"
                    >
                        Lọc Truyện
                    </NavigationLink>
                </div>
            ) : href && !background ? (
                <NavigationLink
                    href={resolvedHref}
                    className="flex justify-between items-center flex-1 basis-full p-3 lg:p-1 mb-3 text-primary"
                >
                    <h2 className="uppercase text-primary">{title}</h2>
                    {icon && <ChevronDoubleRightIcon className="w-4 h-4" />}
                </NavigationLink>
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

                    {rightSlot ? (
                        rightSlot
                    ) : href ? (
                        <NavigationLink
                            href={resolvedHref}
                            className="flex space-x-1 items-center pr-3"
                        >
                            <span>{text}</span>
                            {icon && (
                                <ChevronDoubleRightIcon className="w-3 h-3" />
                            )}
                        </NavigationLink>
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
