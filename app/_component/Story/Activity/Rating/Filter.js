"use client";
import SpinnerMini from "@/app/_component/SpinnerMini";
import { setParams } from "@/app/_lib/helper";
import { useRouter, useSearchParams } from "next/navigation";

const options = [
    {
        label: "Lượt thích",
        value: "mostLiked",
    },
    {
        label: "Mới nhất",
        value: "newest",
    },
    {
        value: "oldest",
        label: "Cũ nhất",
    },
];

function Filter({ count, activeTab, isLoadingDiscuss }) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const searchDisplay = searchParams.get("display") === "true";
    const searchSort = searchParams.get("filter") ?? "mostLiked";

    const handleChange = (display, sort) => {
        const currentDisplay = searchParams.get("display") ?? "false";
        const currentSort = searchParams.get("filter") ?? "mostLiked";

        if (String(display) === currentDisplay && sort === currentSort) return;

        const params = new URLSearchParams(searchParams);

        setParams(params, {
            display: String(display),
            filter: sort,
        });

        router.push(`?${params.toString()}`, { scroll: false });
    };

    return (
        <div className="flex items-center justify-between text-sm">
            {activeTab === "ratings" && (
                <div className="space-x-3 flex items-center">
                    <input
                        type="checkbox"
                        checked={searchDisplay}
                        onChange={(e) => {
                            handleChange(e.target.checked, searchSort);
                        }}
                        className="focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    />
                    <span className="font-medium text-primary">
                        Hiện tất cả
                    </span>
                </div>
            )}
            <div>
                <h3 className="font-semibold">{count} đánh giá</h3>
            </div>
            <div className={activeTab === "comments" ? "order-first" : ""}>
                <select
                    name=""
                    id=""
                    value={searchSort}
                    onChange={(e) => {
                        handleChange(searchDisplay, e.target.value);
                    }}
                    className="custom-select-arrow border border-gray-300 md:text-sm text-base rounded-md"
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>
            {activeTab === "comments" && (
                <button
                    disabled={isLoadingDiscuss}
                    form="comments"
                    className="flex items-center justify-center px-4 py-2 border border-primary text-sm uppercase font-medium text-primary rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 w-16 h-9"
                >
                    {isLoadingDiscuss ? <SpinnerMini /> : "Gửi"}
                </button>
            )}
        </div>
    );
}

export default Filter;
