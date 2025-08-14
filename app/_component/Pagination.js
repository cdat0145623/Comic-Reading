"use client";
import { ChevronLeftIcon } from "@heroicons/react/24/solid";
import { ChevronRightIcon } from "@heroicons/react/24/solid";
import { ChevronDoubleLeftIcon } from "@heroicons/react/24/solid";
import { ChevronDoubleRightIcon } from "@heroicons/react/24/solid";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

function Pagination({ currentPage, totalPages }) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const [inputPage, setInputPage] = useState(currentPage.toString());

    useEffect(() => {
        setInputPage(currentPage.toString());
    }, [currentPage]);

    const goToPage = (page) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", page);
        router.push(`?${params.toString()}`);
    };

    const handleInputKeydown = (e) => {
        if (e.key === "Enter") {
            const parsed = parseInt(inputPage);
            const page =
                !isNaN(parsed) && parsed > 0 ? Math.min(parsed, totalPages) : 1;

            if (page !== currentPage) {
                goToPage(page);
            }

            setInputPage(page.toString());
        }
    };

    return (
        <div className="my-8 flex items-center justify-center space-x-4">
            <button
                className="text-primary"
                onClick={() => goToPage(1)}
                disabled={currentPage <= 1}
            >
                <ChevronDoubleLeftIcon className="w-6 h-6" />
            </button>
            <button
                className="text-primary"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
            >
                <ChevronLeftIcon className="w-6 h-6" />
            </button>
            <div className="relative">
                <input
                    type="text"
                    placeholder={inputPage}
                    value={inputPage}
                    onChange={(e) => setInputPage(e.target.value)}
                    onKeyDown={handleInputKeydown}
                    className="text-sm placeholder:text-gray-500 text-black h-8 w-20 border border-primary rounded px-3 py-2"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <span className=" text-sm">/ {totalPages}</span>
                </div>
            </div>

            <button
                className="text-primary disabled:opacity-50 cursor-pointer disabled:cursor-none"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
            >
                <ChevronRightIcon className="w-6 h-6" />
            </button>
            <button
                className="text-primary disabled:opacity-50 cursor-pointer disabled:cursor-none"
                onClick={() => goToPage(totalPages)}
                disabled={currentPage >= totalPages}
            >
                <ChevronDoubleRightIcon className="w-6 h-6" />
            </button>
        </div>
    );
}

export default Pagination;
