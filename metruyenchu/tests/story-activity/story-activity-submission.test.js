import { describe, expect, it } from "vitest";
import { getLatestActivitySubmissions } from "@/app/_lib/story-activity-submission";

function createAttempt({
    id,
    mutationId,
    status,
    submittedAt,
    content = id,
}) {
    return {
        mutationId,
        status,
        submittedAt,
        variables: {
            clientSubmissionId: id,
            formData: { content },
        },
    };
}

describe("activity pending submissions", () => {
    it("keeps independent pending and failed submissions", () => {
        const submissions = getLatestActivitySubmissions([
            createAttempt({
                id: "a",
                mutationId: 1,
                status: "error",
                submittedAt: 10,
            }),
            createAttempt({
                id: "b",
                mutationId: 2,
                status: "pending",
                submittedAt: 20,
            }),
        ]);

        expect(submissions.map((item) => item.variables.clientSubmissionId)).toEqual([
            "a",
            "b",
        ]);
    });

    it("uses the latest retry attempt for the same submission", () => {
        const submissions = getLatestActivitySubmissions([
            createAttempt({
                id: "a",
                mutationId: 1,
                status: "error",
                submittedAt: 10,
            }),
            createAttempt({
                id: "a",
                mutationId: 2,
                status: "pending",
                submittedAt: 20,
            }),
        ]);

        expect(submissions).toHaveLength(1);
        expect(submissions[0]).toMatchObject({
            mutationId: 2,
            status: "pending",
        });
    });

    it("hides previous failed attempts after a retry succeeds", () => {
        const submissions = getLatestActivitySubmissions([
            createAttempt({
                id: "a",
                mutationId: 1,
                status: "error",
                submittedAt: 10,
            }),
            createAttempt({
                id: "a",
                mutationId: 2,
                status: "success",
                submittedAt: 20,
            }),
        ]);

        expect(submissions).toEqual([]);
    });

    it("uses mutationId to resolve attempts submitted in the same millisecond", () => {
        const submissions = getLatestActivitySubmissions([
            createAttempt({
                id: "a",
                mutationId: 1,
                status: "error",
                submittedAt: 10,
            }),
            createAttempt({
                id: "a",
                mutationId: 2,
                status: "pending",
                submittedAt: 10,
            }),
        ]);

        expect(submissions[0]).toMatchObject({
            mutationId: 2,
            status: "pending",
        });
    });
});
