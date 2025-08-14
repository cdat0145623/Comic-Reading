"use client";
import clsx from "clsx";
import {
    useParams,
    usePathname,
    useRouter,
    useSearchParams,
} from "next/navigation";
function Tabs({ ratingsCount, commentsCount, fansCount }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const params = useParams();
    const path = usePathname();

    const activeTab = searchParams?.get("tab") ?? "ratings";
    const isActive = (tab) =>
        clsx(
            "px-3 py-2 border-x border-slate-100 flex items-center",
            activeTab === tab && "bg-primary text-white"
        );

    const handleTabChange = (newTab) => {
        const params = new URLSearchParams();
        params.set("tab", newTab);
        router.push(`${path}?${params.toString()}`, { scroll: false });
    };

    return (
        <div className="flex items-center justify-center bg-secondary text-gray-600 text-xs">
            <button
                className={isActive("ratings")}
                onClick={() => handleTabChange("ratings")}
            >
                <span>ĐÁNH GIÁ</span>
                <span className="bg-red-700 min-w-6 h-6 text-white rounded-full flex items-center justify-center px-2 ms-2 font-semibold">
                    {ratingsCount}
                </span>
            </button>
            <button
                className={isActive("comments")}
                onClick={() => handleTabChange("comments")}
            >
                <span>THẢO LUẬN</span>
                <span className="bg-red-700 min-w-6 h-6 text-white rounded-full flex items-center justify-center px-2 ms-2 font-semibold">
                    {commentsCount}
                </span>
            </button>
            <button
                className={isActive("fans")}
                onClick={() => handleTabChange("fans")}
            >
                <span>HÂM MỘ</span>
                <span className="bg-red-700 min-w-6 h-6 text-white rounded-full flex items-center justify-center px-2 ms-2 font-semibold">
                    {fansCount}
                </span>
            </button>
        </div>
    );
}

export default Tabs;
