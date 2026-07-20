import { describe, expect, it, vi } from "vitest";
import {
    normalizeLikeInput,
    setActivityLikeState,
} from "@/app/_lib/story-activity-like-service";

function createTransactionMock({ relationCount, counterCount = 1 }) {
    const relationModel = {
        createMany: vi.fn().mockResolvedValue({ count: relationCount }),
        deleteMany: vi.fn().mockResolvedValue({ count: relationCount }),
    };
    const counterModel = {
        updateMany: vi.fn().mockResolvedValue({ count: counterCount }),
    };

    return {
        tx: {
            ratingLike: relationModel,
            ratingCommentLike: relationModel,
            discussLike: relationModel,
            rating: counterModel,
            discuss: counterModel,
        },
        relationModel,
        counterModel,
    };
}

describe("setActivityLikeState", () => {
    it("creates a rating like and increments the counter once", async () => {
        const { tx, relationModel, counterModel } = createTransactionMock({
            relationCount: 1,
        });

        await expect(
            setActivityLikeState({
                tx,
                userId: "user-1",
                target: "rating",
                targetId: 93,
                liked: true,
            }),
        ).resolves.toEqual({
            target: "rating",
            targetId: 93,
            liked: true,
            changed: true,
        });
        expect(relationModel.createMany).toHaveBeenCalledWith({
            data: { userId: "user-1", ratingId: 93 },
            skipDuplicates: true,
        });
        expect(counterModel.updateMany).toHaveBeenCalledTimes(1);
    });

    it("does not increment when the same like request is repeated", async () => {
        const { tx, counterModel } = createTransactionMock({ relationCount: 0 });

        const result = await setActivityLikeState({
            tx,
            userId: "user-1",
            target: "rating",
            targetId: 93,
            liked: true,
        });

        expect(result.changed).toBe(false);
        expect(counterModel.updateMany).not.toHaveBeenCalled();
    });

    it("deletes a discussion like and decrements only a positive counter", async () => {
        const { tx, relationModel, counterModel } = createTransactionMock({
            relationCount: 1,
        });

        await setActivityLikeState({
            tx,
            userId: "user-1",
            target: "discussion",
            targetId: 12,
            liked: false,
        });

        expect(relationModel.deleteMany).toHaveBeenCalledWith({
            where: { userId: "user-1", discussId: 12 },
        });
        expect(counterModel.updateMany).toHaveBeenCalledWith({
            where: { id: 12, likeCount: { gt: 0 } },
            data: { likeCount: { decrement: 1 } },
        });
    });

    it("does not update a scalar counter for rating comments", async () => {
        const { tx, counterModel } = createTransactionMock({ relationCount: 1 });

        await setActivityLikeState({
            tx,
            userId: "user-1",
            target: "ratingComment",
            targetId: 7,
            liked: true,
        });

        expect(counterModel.updateMany).not.toHaveBeenCalled();
    });

    it("throws so the transaction rolls back when the counter cannot sync", async () => {
        const { tx } = createTransactionMock({
            relationCount: 1,
            counterCount: 0,
        });

        await expect(
            setActivityLikeState({
                tx,
                userId: "user-1",
                target: "rating",
                targetId: 93,
                liked: false,
            }),
        ).rejects.toThrow("Không thể đồng bộ số lượt thích");
    });
});

describe("normalizeLikeInput", () => {
    it("rejects invalid targets, ids and desired states", () => {
        expect(() =>
            normalizeLikeInput({ target: "unknown", targetId: 1, liked: true }),
        ).toThrow("Loại lượt thích không hợp lệ");
        expect(() =>
            normalizeLikeInput({ target: "rating", targetId: 0, liked: true }),
        ).toThrow("Đối tượng lượt thích không hợp lệ");
        expect(() =>
            normalizeLikeInput({ target: "rating", targetId: 1, liked: "yes" }),
        ).toThrow("Trạng thái lượt thích không hợp lệ");
    });
});
