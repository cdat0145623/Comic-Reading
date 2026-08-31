"use client";

import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";

import { useSession } from "next-auth/react";
import { useModal } from "../Modal/Modal";
import { notify } from "@/lib/toaster";
import SpinnerMini from "../SpinnerMini";
import { useCreateRating } from "@/app/hooks/useCreateRating";
import PendingActivityList from "./Activity/PendingActivityList";
import { activityMutationKeys } from "@/app/_lib/story-activity-query";
import { useActivityDraft } from "@/app/hooks/useActivityDraft";

function FormRating({ onCancel, onSuccess, storyId }) {
    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        getValues,
        clearErrors,
        watch,
        reset,
    } = useForm({
        defaultValues: {
            stars: 5,
            onlyStar: false,
            character: "",
            plot: "",
            world: "",
            content: "",
        },
    });
    const onlyStar = watch("onlyStar");
    const { data: session } = useSession();
    const { open } = useModal();
    const handleSuccess = (newRating, message) => {
        notify({ type: "success", message });

        if (onSuccess) {
            onSuccess(newRating);
            return;
        }

        window.setTimeout(() => {
            document
                .getElementById(`rating-${newRating.id}`)
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
        });
    };

    const { createRating, isLoadingRating } = useCreateRating({
        onSuccess: handleSuccess,
        storyId,
    });
    const clearDraft = useActivityDraft({
        reset,
        scope: `rating:${storyId}`,
        userId: session?.user?.id,
        watch,
    });

    const onRating = () => {
        if (!session) {
            open("signIn");
            return;
        }
        if (onlyStar) {
            setValue("character", "");
            setValue("plot", "");
            setValue("world", "");
            setValue("content", "");
            clearErrors(["character", "plot", "world", "content"]);
        }
        createRating({
            clientSubmissionId: crypto.randomUUID(),
            formData: getValues(),
            storyId,
        });
        clearDraft();
        reset();
    };
    return (
        <>
            <form
                className="p-4 border border-gray-200 rounded-lg space-y-6 col-span-full"
                onSubmit={handleSubmit(onRating)}
            >
            {onCancel && (
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isLoadingRating}
                        className="text-sm font-medium text-primary disabled:cursor-wait disabled:opacity-60"
                    >
                        Quay lại bình luận
                    </button>
                </div>
            )}
            <div className="p-2">
                <div className="flex flex-col space-y-2 w-full">
                    <h3 className="text-sm">
                        Chấm điểm nội dung truyện:
                        <span className="font-bold text-primary">
                            &nbsp;{watch("stars")}&nbsp;
                        </span>
                        điểm
                    </h3>
                    <div className="w-full text-primary">
                        <input
                            name="stars"
                            type="range"
                            {...register("stars")}
                            min="3"
                            max="5"
                            step="0.1"
                            className="w-full slider"
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center">
                <input
                    type="checkbox"
                    name="onlyStar"
                    className="focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    {...register("onlyStar")}
                    alt=""
                />
                <div className="ml-3 space-x-1 text-sm">
                    <span className="font-medium text-gray-500">
                        Tôi chỉ muốn chấm điểm
                    </span>
                    <span className="text-gray-500">(không viết đánh giá)</span>
                </div>
            </div>

            {!onlyStar && (
                <AnimatePresence>
                    <motion.div
                        key="criteria-section"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                    >
                        <input
                            type="text"
                            {...register("character")}
                            placeholder="Nhân vật chính như nào? (nhiệt huyết?, vô sỉ?, thông minh? ...)"
                            className="py-2 px-3 text-sm text-gray-900 w-full border border-gray-200 focus:ring-1 focus:outline-none focus:ring-primary"
                        />
                        <input
                            type="text"
                            {...register("plot")}
                            className="py-2 px-3 text-sm text-gray-900 w-full border border-gray-200 focus:ring-1 focus:outline-none focus:ring-primary"
                            placeholder="Cốt truyện như nào? (logic?, sảng văn?, bố cục nhiều lớp?, quay xe liên tục? ...)"
                        />
                        <input
                            type="text"
                            {...register("world")}
                            className="py-2 px-3 text-sm text-gray-900 w-full border border-gray-200 focus:ring-1 focus:outline-none focus:ring-primary"
                            placeholder="Bố cục thế giới như nào? (lớn hay nhỏ?, một thế giới?, nhiều thế giới?, nhiều tầng? ...)"
                        />
                        <textarea
                            {...register("content")}
                            rows="2"
                            className="resize-none py-2 px-3 text-sm text-gray-900 w-full border border-gray-200 focus:ring-1 focus:outline-none focus:ring-primary"
                            onInput={(e) => {
                                e.target.style.height = "auto";
                                e.target.style.height = `${e.target.scrollHeight}px`;
                            }}
                            placeholder="Nội dung bài đánh giá (ít nhất 100 từ)..."
                        ></textarea>
                        {errors.content && (
                            <p className="text-red-500 mt-2">
                                {errors.content.message}
                            </p>
                        )}
                    </motion.div>
                </AnimatePresence>
            )}

            <div className="flex items-center justify-center">
                {isLoadingRating ? (
                    <span className="mx-auto">
                        <SpinnerMini />
                    </span>
                ) : (
                    <button className="px-4 py-2 border border-primary text-sm shadow-sm font-medium rounded-md text-primary w-1/3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900">
                        GỬI ĐÁNH GIÁ
                    </button>
                )}
            </div>
            </form>
            <PendingActivityList
                mutationKey={activityMutationKeys.rating(storyId)}
                onRetry={createRating}
                variant="rating"
            />
        </>
    );
}

export default FormRating;
