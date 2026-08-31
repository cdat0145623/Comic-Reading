"use client";

import { notify } from "@/lib/toaster";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { useModal } from "@/app/_component/Modal/Modal";
import { useActivityDraft } from "@/app/hooks/useActivityDraft";

function FormDiscuss({ storyId, createDiscuss }) {
    const {
        register,
        handleSubmit,
        getValues,
        reset,
        watch,
    } = useForm();

    const { data: session } = useSession();
    const { open } = useModal();
    const clearDraft = useActivityDraft({
        reset,
        scope: `root-discussion:${storyId}`,
        userId: session?.user?.id,
        watch,
    });
    const onDiscuss = () => {
        if (!session) {
            open("signIn");
            return;
        }
        createDiscuss({
            clientSubmissionId: crypto.randomUUID(),
            formData: getValues(),
            storyId,
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
        <div className="mb-6">
            <form id="comments" onSubmit={handleSubmit(onDiscuss, onError)}>
                <div className="px-4 py-2 border border-gray-200 rounded-md mb-4 bg-white">
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
                        rows="6"
                        className="w-full px-0 py-2 focus:outline-none text-gray-900 text-base resize-none"
                        placeholder="Thảo luận ..."
                        onInput={(e) => {
                            e.target.style.height = "auto";
                            e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                    ></textarea>
                </div>
            </form>
        </div>
    );
}

export default FormDiscuss;
