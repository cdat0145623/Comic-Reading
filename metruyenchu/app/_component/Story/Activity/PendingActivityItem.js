"use client";

import {
    ArrowPathIcon,
    ExclamationCircleIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import SpinnerMini from "@/app/_component/SpinnerMini";
import { getPublicActivityErrorMessage } from "@/app/_lib/story-activity-error";

function PendingActivityItem({
    onDismiss,
    onRetry,
    submission,
    user,
    variant = "comment",
}) {
    const isPending = submission?.status === "pending";
    const isError = submission?.status === "error";
    const content = submission?.variables?.formData?.content?.trim();
    const rating = submission?.variables?.formData;
    const isRating = variant === "rating";
    const errorMessage = getPublicActivityErrorMessage(
        submission?.error,
        isRating
            ? "Không thể lưu đánh giá. Vui lòng thử lại."
            : "Không thể gửi bình luận. Vui lòng thử lại.",
    );

    if ((!isPending && !isError) || (!isRating && !content)) return null;

    return (
        <div
            className={`mb-4 rounded-md border p-4 ${
                isError
                    ? "border-red-300 bg-red-50"
                    : "border-primary/40 bg-slate-50"
            }`}
            aria-live="polite"
        >
            <div className="mb-2 flex items-center justify-between gap-4">
                <span className="text-sm font-semibold text-gray-900">
                    {user?.name || "Bạn"}
                </span>
                <span
                    className={`flex items-center gap-2 text-xs ${
                        isError ? "text-red-700" : "text-gray-500"
                    }`}
                >
                    {isPending ? (
                        <>
                            <SpinnerMini />
                            Đang gửi...
                        </>
                    ) : (
                        <>
                            <ExclamationCircleIcon className="h-4 w-4" />
                            Gửi thất bại
                        </>
                    )}
                </span>
            </div>
            {isRating ? (
                <div className="space-y-1 text-sm text-gray-700">
                    <p className="font-medium">Đánh giá {rating?.stars} sao</p>
                    {[rating?.character, rating?.plot, rating?.world, content]
                        .filter(Boolean)
                        .map((value, index) => (
                            <p key={index} className="whitespace-pre-wrap">
                                {value}
                            </p>
                        ))}
                </div>
            ) : (
                <p className="whitespace-pre-wrap text-sm text-gray-700">
                    {content}
                </p>
            )}
            {isError && (
                <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-xs text-red-700">
                        {errorMessage}
                    </span>
                    <div className="flex shrink-0 items-center gap-3">
                        <button
                            type="button"
                            onClick={() => onRetry(submission.variables)}
                            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                        >
                            <ArrowPathIcon className="h-4 w-4" />
                            Thử lại
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                onDismiss(
                                    submission.variables.clientSubmissionId,
                                )
                            }
                            className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 hover:underline"
                        >
                            <XMarkIcon className="h-4 w-4" />
                            Xóa
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PendingActivityItem;
