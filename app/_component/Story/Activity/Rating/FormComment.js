"use client";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { useModal } from "@/app/_component/Modal/Modal";
import { notify } from "@/lib/toaster";
import { useParams } from "next/navigation";
import SpinnerMini from "@/app/_component/SpinnerMini";
import { useEffect, useRef, useState } from "react";
import { useCreateComment } from "@/app/hooks/useCreateComment";

function FormComment({
    storyId,
    sortOption,
    ratingId,
    setIsReply,
    setNewComments,
    commentId,
    onRatingUpdated,
    mentionName,
    user,
    tempComments,
    setTempComments,
    showComments,
    setShowComments,
    activeTab,
    // setCommentIdToRootMap,
    // commentIdToRootMap,
}) {
    // console.log("ratingId", ratingId);
    const {
        register,
        formState: { errors, isSubmitting, isSubmitted },
        handleSubmit,
        setValue,
        getValues,
        clearErrors,
        reset,
        setFocus,
        watch,
    } = useForm();

    const { data: session } = useSession();
    const { open } = useModal();
    const params = useParams();
    const textAreaRef = useRef(null);
    const [placeholder, setPlaceHolder] = useState("Trả lời...");
    const handleSuccess = (newComment, message) => {
        reset();
        setIsReply((prev) => !prev);
        if (showComments === false) {
            setShowComments(true);
        }
        notify({ type: "success", message: message || "Success" });
    };
    const { submitComment, isLoadingComment } = useCreateComment({
        tempComments,
        setTempComments,
        showComments,
        onSuccess: handleSuccess,
        sortOption,
        rootCommentId: ratingId,
        // setCommentIdToRootMap,
        // commentIdToRootMap,
    });

    useEffect(() => {
        setFocus("content");
        if (mentionName) {
            const current = watch("content") || "";
            const isReplyOther = user?.id !== session?.user?.id;
            console.log("isReplyToOther::", isReplyOther);
            if (!current.startsWith(mentionName) && isReplyOther) {
                setPlaceHolder(`${mentionName} ${current}`);
            }
        }
        // }
    }, []);

    const onComment = async (data) => {
        console.log("Data:", data);
        const params =
            activeTab === "ratings"
                ? {
                      formData: getValues(),
                      ratingId,
                      commentId,
                      storyId,
                      active: activeTab,
                  }
                : {
                      formData: getValues(),
                      commentId,
                      storyId,
                      active: activeTab,
                  };

        if (!session) {
            open("signIn");
            return;
        }
        submitComment(params);

        // submitComment({
        //     formData: getValues(),
        //     ratingId,
        //     commentId,
        //     storyId,
        //     active: activeTab,
        // });
    };

    const onError = async (errors) => {
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
                        ref={textAreaRef}
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
