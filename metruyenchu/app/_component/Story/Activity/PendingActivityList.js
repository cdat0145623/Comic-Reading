"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
    useMutationState,
    useQueryClient,
} from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { getLatestActivitySubmissions } from "@/app/_lib/story-activity-submission";
import PendingActivityItem from "./PendingActivityItem";
import {
    getActivitySubmissionsSnapshot,
    getServerActivitySubmissionsSnapshot,
    removeActivitySubmission,
    subscribeActivityEvents,
} from "@/app/_lib/story-activity-sync";

function keysMatch(left, right) {
    return JSON.stringify(left) === JSON.stringify(right);
}

function PendingActivityList({
    className = "",
    mutationKey,
    onRetry,
    variant,
}) {
    const queryClient = useQueryClient();
    const { data: session } = useSession();
    const attempts = useMutationState({
        filters: { mutationKey, exact: true },
        select: (mutation) => ({
            error: mutation.state.error,
            mutationId: mutation.mutationId,
            status: mutation.state.status,
            submittedAt: mutation.state.submittedAt,
            variables: mutation.state.variables,
        }),
    });
    const persistedSubmissions = useSyncExternalStore(
        subscribeActivityEvents,
        getActivitySubmissionsSnapshot,
        getServerActivitySubmissionsSnapshot,
    );
    const sharedAttempts = useMemo(
        () =>
            persistedSubmissions
                .filter(
                    (submission) =>
                        submission.userId === session?.user?.id &&
                        keysMatch(submission.mutationKey, mutationKey),
                )
                .map((submission, index) => ({
                    ...submission,
                    mutationId: -(index + 1),
                })),
        [mutationKey, persistedSubmissions, session?.user?.id],
    );
    const submissions = useMemo(
        () => getLatestActivitySubmissions([...attempts, ...sharedAttempts]),
        [attempts, sharedAttempts],
    );

    const handleDismiss = (clientSubmissionId) => {
        const mutationCache = queryClient.getMutationCache();
        const matchingMutations = mutationCache.findAll({
            mutationKey,
            exact: true,
        });

        for (const mutation of matchingMutations) {
            if (
                mutation.state.variables?.clientSubmissionId ===
                clientSubmissionId
            ) {
                mutationCache.remove(mutation);
            }
        }
        removeActivitySubmission({
            clientSubmissionId,
            userId: session?.user?.id,
        });
    };

    if (submissions.length === 0) return null;

    return (
        <div className={className}>
            {submissions.map((submission) => (
                <PendingActivityItem
                    key={submission.variables.clientSubmissionId}
                    submission={submission}
                    user={session?.user}
                    onDismiss={handleDismiss}
                    onRetry={onRetry}
                    variant={variant}
                />
            ))}
        </div>
    );
}

export default PendingActivityList;
