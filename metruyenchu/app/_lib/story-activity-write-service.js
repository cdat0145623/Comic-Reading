import { prisma } from "@/lib/prisma";
import { countTotalWorlds } from "./data-service";

const includeUser = { user: true };

async function findRatingCommentSubmission({
    clientSubmissionId,
    ratingId,
    userId,
}) {
    return prisma.ratingComment.findFirst({
        where: { clientSubmissionId, ratingId, userId },
        include: includeUser,
    });
}

async function findDiscussionSubmission({
    clientSubmissionId,
    storyId,
    userId,
}) {
    return prisma.discuss.findFirst({
        where: { clientSubmissionId, storyId, userId },
        include: includeUser,
    });
}

async function recoverUniqueSubmission(error, findExisting) {
    if (error?.code !== "P2002") throw error;
    const existing = await findExisting();
    if (!existing) throw error;
    return existing;
}

async function upsertStoryRating({ formData, storyId, userId }) {
    const { stars, character, plot, world, content } = formData;
    const data = {
        stars: Number.parseFloat(stars),
        character,
        plot,
        world,
        content,
        wordCount: countTotalWorlds(formData),
    };

    return prisma.rating.upsert({
        where: { userId_storyId: { userId, storyId } },
        update: data,
        create: { ...data, storyId, userId },
        include: includeUser,
    });
}

async function createRatingComment({
    clientSubmissionId,
    commentId,
    content,
    ratingId,
    userId,
}) {
    const existing = await findRatingCommentSubmission({
        clientSubmissionId,
        ratingId,
        userId,
    });
    if (existing) return existing;

    try {
        return await prisma.$transaction(async (tx) => {
            if (commentId) {
                const parent = await tx.ratingComment.findFirst({
                    where: { id: commentId, ratingId },
                    select: { id: true },
                });
                if (!parent) throw new Error("Bình luận cha không hợp lệ");
            }

            return tx.ratingComment.create({
                data: {
                    clientSubmissionId,
                    content,
                    ratingId,
                    parentId: commentId ?? null,
                    userId,
                },
                include: includeUser,
            });
        });
    } catch (error) {
        return recoverUniqueSubmission(error, () =>
            findRatingCommentSubmission({
                clientSubmissionId,
                ratingId,
                userId,
            }),
        );
    }
}

async function createStoryDiscussion({
    clientSubmissionId,
    content,
    storyId,
    userId,
}) {
    const existing = await findDiscussionSubmission({
        clientSubmissionId,
        storyId,
        userId,
    });
    if (existing) return existing;

    try {
        return await prisma.discuss.create({
            data: {
                clientSubmissionId,
                content,
                storyId,
                userId,
            },
            include: includeUser,
        });
    } catch (error) {
        return recoverUniqueSubmission(error, () =>
            findDiscussionSubmission({
                clientSubmissionId,
                storyId,
                userId,
            }),
        );
    }
}

async function createDiscussionReply({
    clientSubmissionId,
    commentId,
    content,
    rootCommentId,
    storyId,
    userId,
}) {
    const existing = await findDiscussionSubmission({
        clientSubmissionId,
        storyId,
        userId,
    });
    if (existing) return existing;

    try {
        return await prisma.$transaction(async (tx) => {
            const [root, parent] = await Promise.all([
                tx.discuss.findFirst({
                    where: {
                        id: rootCommentId,
                        storyId,
                        parentId: null,
                    },
                    select: { id: true },
                }),
                tx.discuss.findFirst({
                    where: {
                        id: commentId,
                        storyId,
                        OR: [
                            { id: rootCommentId },
                            { threadRootId: rootCommentId },
                        ],
                    },
                    select: { id: true },
                }),
            ]);

            if (!root || !parent) {
                throw new Error("Thread thảo luận không hợp lệ");
            }

            return tx.discuss.create({
                data: {
                    clientSubmissionId,
                    content,
                    storyId,
                    parentId: commentId,
                    threadRootId: rootCommentId,
                    userId,
                },
                include: includeUser,
            });
        });
    } catch (error) {
        return recoverUniqueSubmission(error, () =>
            findDiscussionSubmission({
                clientSubmissionId,
                storyId,
                userId,
            }),
        );
    }
}

export {
    createDiscussionReply,
    createRatingComment,
    createStoryDiscussion,
    upsertStoryRating,
};
