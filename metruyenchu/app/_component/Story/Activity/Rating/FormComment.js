"use client";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { useModal } from "@/app/_component/Modal/Modal";
import { notify } from "@/lib/toaster";
import SpinnerMini from "@/app/_component/SpinnerMini";
import { useEffect, useState } from "react";
import { useCreateComment } from "@/app/hooks/useCreateComment";
import { useActivityDraft } from "@/app/hooks/useActivityDraft";

function FormComment({
    storyId,
    ratingId,
    rootCommentId,
    setIsReply,
    commentId,
    mentionName,
    user,
    showComments,
    setShowComments,
    activeTab,
}) {
    // console.log("ratingId", ratingId);
    const {
        register,
        handleSubmit,
        getValues,
        reset,
        setFocus,
        watch,
    } = useForm();

    const { data: session } = useSession();
    const { open } = useModal();
    const [placeholder, setPlaceHolder] = useState("Trả lời...");
    const handleSuccess = (_newComment, message) => {
        setIsReply(false);
        notify({ type: "success", message: message || "Success" });
    };
    const { submitComment, isLoadingComment } = useCreateComment({
        activeTab,
        onSuccess: handleSuccess,
        ratingId,
        rootCommentId,
        storyId,
    });
    const clearDraft = useActivityDraft({
        reset,
        scope: `${activeTab}:${storyId}:${ratingId || rootCommentId}:${commentId || "root"}`,
        userId: session?.user?.id,
        watch,
    });

    useEffect(() => {
        setFocus("content");
        if (mentionName) {
            const current = watch("content") || "";
            const isReplyOther = user?.id !== session?.user?.id;
            if (!current.startsWith(mentionName) && isReplyOther) {
                setPlaceHolder(`${mentionName} ${current}`);
            }
        }
        // }
    }, [mentionName, session?.user?.id, setFocus, user?.id, watch]);

    const onComment = async () => {
        const params =
            activeTab === "ratings"
                ? {
                      formData: getValues(),
                      ratingId,
                      commentId,
                      rootCommentId,
                      storyId,
                      active: activeTab,
                  }
                : {
                      formData: getValues(),
                      commentId,
                      rootCommentId,
                      storyId,
                      active: activeTab,
                  };

        if (!session) {
            open("signIn");
            return;
        }
        if (showComments === false) setShowComments(true);
        submitComment({
            ...params,
            clientSubmissionId: crypto.randomUUID(),
        });
        clearDraft();
        reset();
    };

    const onError = (errors) => {
        if (errors?.content?.message) {
            notify({
                type: "error",
                message: errors.content.message,
                duration: 5000,
            });
        }
    };

    return (
        <div className="ml-12 mb-4">
            <form onSubmit={handleSubmit(onComment, onError)}>
                <div className="mb-4 flex items-center space-x-2">
                    <textarea
                        {...register("content", {
                            required: "Nội dung không được để trống",
                            validate: (value) => {
                                const trimmed = value.trim();
                                if (trimmed.length === 0)
                                    return "Nội dung không được để trống";
                                const wordCount = trimmed.split(/\s+/).length;
                                if (wordCount < 3)
                                    return "Nội dung phải có ít nhất 3 từ";
                                return true;
                            },
                        })}
                        id=""
                        rows="1"
                        className="resize-none w-full text-gray-900 text-base p-2 shadow focus:outline-none focus:ring-0 rounded border-0"
                        placeholder={placeholder}
                        onInput={(e) => {
                            e.target.style.height = "auto";
                            e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                    ></textarea>
                    <button
                        disabled={isLoadingComment}
                        className="flex items-center justify-center px-4 py-2 border border-primary text-sm uppercase font-medium text-primary rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 w-16 h-9"
                    >
                        {isLoadingComment ? <SpinnerMini /> : "Gửi"}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default FormComment;
