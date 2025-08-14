"use client";
import { useCreateDiscuss } from "@/app/hooks/useCreateDiscuss";
import Filter from "../Rating/Filter";
import FormDiscuss from "./FormDiscuss";
import { notify } from "@/lib/toaster";
import { useTransition } from "react";

function WrapperFormDiscuss({ activeTab, count, filter, storyId }) {
    const [isPending, startTransition] = useTransition();
    const handleSuccess = (newDiscuss, message) => {
        notify({ type: "success", message: message || "Success" });
        startTransition(() => {
            requestAnimationFrame(() => {
                const el = document.getElementById(`rating-${newDiscuss.id}`);
                console.log("el:", el);
                if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "center" });
                }
            });
        });
    };
    const { createDiscuss, isLoadingDiscuss } = useCreateDiscuss({
        onSuccess: handleSuccess,
    });
    return (
        <div>
            <FormDiscuss
                storyId={storyId}
                filter={filter}
                createDiscuss={createDiscuss}
            />
            <Filter
                activeTab={activeTab}
                count={count}
                isLoadingDiscuss={isLoadingDiscuss}
            />
        </div>
    );
}

export default WrapperFormDiscuss;
