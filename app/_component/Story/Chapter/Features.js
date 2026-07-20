"use client";
import { ChevronDoubleLeftIcon } from "@heroicons/react/16/solid";
import { ChevronDoubleRightIcon } from "@heroicons/react/16/solid";
import { StarIcon } from "@heroicons/react/24/solid";
import { GiftIcon } from "@heroicons/react/24/solid";
import { FlagIcon } from "@heroicons/react/24/solid";
import { TicketIcon } from "@heroicons/react/24/solid";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import Spinner from "../../Spinner";
import { useNavigationProgress } from "../../NavigationProgressBar";
import { useChapterNavigation } from "@/app/hooks/useChapterNavigation";

function Features({ isRatingActive = false, onRatingClick, totalChapter }) {
    const params = useParams();
    const router = useRouter();
    const { startNavigationProgress } = useNavigationProgress();
    const { navigateToChapter, isNavigatingChapter } = useChapterNavigation();
    const [isPending, startTransition] = useTransition();
    const [pendingTarget, setPendingTarget] = useState(null);

    console.log("paramss::", params);
    const currentChapter = Number(params.number.replace("chuong-", ""));
    // console.log("currentChapter:::", currentChapter);
    useEffect(() => {
        setPendingTarget(null);
    }, [params.number]);

    const gotoChapter = async (numberChapter, target) => {
        console.log("number chapters:", numberChapter);
        setPendingTarget(target);

        if (numberChapter < 1 || numberChapter > totalChapter) {
            const href = `/truyen/${params.slug}`;

            startNavigationProgress();
            startTransition(() => {
                router.push(href);
            });
            return;
        }

        const didNavigate = await navigateToChapter({
            slug: params.slug,
            number: numberChapter,
        });

        if (!didNavigate) setPendingTarget(null);
    };

    const renderNavigationIcon = (target, icon) => {
        if (
            (isPending || isNavigatingChapter) &&
            pendingTarget === target
        ) {
            return (
                <Spinner
                    className="flex items-center justify-center"
                    iconClassName="w-5 h-5"
                />
            );
        }

        return icon;
    };

    const isNavigationPending =
        (isPending || isNavigatingChapter) && Boolean(pendingTarget);

    return (
        <>
            <div className="px-2 py-4 grid grid-flow-col">
                <button
                    onClick={() => gotoChapter(currentChapter - 1, "prev")}
                    disabled={isNavigationPending}
                    className="flex items-center justify-center disabled:cursor-wait disabled:opacity-70"
                >
                    <div className="flex flex-col items-center justify-center space-y-2 text-sm">
                        {renderNavigationIcon(
                            "prev",
                            <ChevronDoubleLeftIcon className="w-5 h-5 border text-white bg-primary rounded" />,
                        )}
                        <span className="sm:block hidden">Chương trước</span>
                    </div>
                </button>
                <button
                    type="button"
                    onClick={onRatingClick}
                    aria-pressed={isRatingActive}
                    className={`flex items-center justify-center transition-colors ${
                        isRatingActive ? "text-primary" : ""
                    }`}
                >
                    <div className="flex flex-col items-center justify-center space-y-2 text-sm">
                        <StarIcon className="w-6 h-6 text-primary" />

                        <span className="sm:block hidden">Chấm điểm</span>
                    </div>
                </button>
                <button className="flex items-center justify-center">
                    <div className="flex flex-col items-center justify-center space-y-2 text-sm">
                        <GiftIcon className="w-6 h-6 text-primary" />

                        <span className="sm:block hidden">Chọn quà</span>
                    </div>
                </button>
                <button className="flex items-center justify-center">
                    <div className="flex flex-col items-center justify-center space-y-2 text-sm">
                        <FlagIcon className="w-6 h-6 text-primary" />

                        <span className="sm:block hidden"> Báo cáo</span>
                    </div>
                </button>
                <button className="flex items-center justify-center">
                    <div className="flex flex-col items-center justify-center space-y-2 text-sm">
                        <TicketIcon className="w-6 h-6 text-primary" />

                        <span className="sm:block hidden">Đề cử</span>
                    </div>
                </button>
                <button
                    onClick={() => gotoChapter(currentChapter + 1, "next")}
                    disabled={isNavigationPending}
                    className="flex items-center justify-center disabled:cursor-wait disabled:opacity-70"
                >
                    <div className="flex flex-col items-center justify-center space-y-2 text-sm">
                        {renderNavigationIcon(
                            "next",
                            <ChevronDoubleRightIcon className="w-5 h-5 border text-white bg-primary rounded" />,
                        )}

                        <span className="sm:block hidden">Chương sau</span>
                    </div>
                </button>
            </div>
            <div className="grid grid-cols-2 sm:hidden gap-x-4 px-2 text-sm">
                <button
                    onClick={() => gotoChapter(currentChapter - 1, "prev")}
                    disabled={currentChapter <= 1 || isNavigationPending}
                    className="px-4 py-2 bg-primary text-white rounded disabled:cursor-wait disabled:opacity-70"
                >
                    {(isPending || isNavigatingChapter) &&
                    pendingTarget === "prev" ? (
                        <Spinner
                            className="flex items-center justify-center"
                            iconClassName="w-5 h-5"
                        />
                    ) : (
                        "Chương trước"
                    )}
                </button>
                <button
                    onClick={() => gotoChapter(currentChapter + 1, "next")}
                    disabled={isNavigationPending}
                    className="px-4 py-2 bg-primary text-white rounded disabled:cursor-wait disabled:opacity-70"
                >
                    {(isPending || isNavigatingChapter) &&
                    pendingTarget === "next" ? (
                        <Spinner
                            className="flex items-center justify-center"
                            iconClassName="w-5 h-5"
                        />
                    ) : (
                        "Chương sau"
                    )}
                </button>
            </div>
        </>
    );
}

export default Features;
