"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "../../lib/auth";
import { FormCommentValidate, FormRatingValidate } from "./validate";
import { setActivityLikeState } from "./story-activity-like-service";
import {
    createDiscussionReply,
    createRatingComment,
    createStoryDiscussion,
    upsertStoryRating,
} from "./story-activity-write-service";
import { getPublicActivityErrorMessage } from "./story-activity-error";
import { z } from "zod";

const UserLibrarySettingsSchema = z.object({
    sortReading: z.enum(["LATESTCHAPTER", "RECENTLYREAD", "TITLE"]),
    sortMarked: z.enum(["LATESTCHAPTER", "RECENTLYSAVED", "TITLE"]),
    notifyGeneral: z.boolean(),
});

function getValidationMessage(result, fallback) {
    return result.error?.flatten().fieldErrors.content?.[0] || fallback;
}

function hasValidSubmissionId(clientSubmissionId) {
    return (
        typeof clientSubmissionId === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            clientSubmissionId,
        )
    );
}

function invalidSubmissionResponse(clientSubmissionId) {
    return hasValidSubmissionId(clientSubmissionId)
        ? null
        : { success: false, error: "Mã submission không hợp lệ" };
}

async function upsertStoryRatingAction({
    clientSubmissionId,
    formData,
    storyId,
}) {
    const { stars, character, plot, world, content } = formData;
    const session = await auth();
    if (!session) {
        return { success: false, error: "Bạn chưa đăng nhập" };
    }
    const submissionError = invalidSubmissionResponse(clientSubmissionId);
    if (submissionError) return submissionError;

    if (character || plot || world || content) {
        const validateContent = FormRatingValidate.safeParse({
            character,
            plot,
            world,
            content,
        });
        if (!validateContent.success) {
            throw new Error(
                getValidationMessage(
                    validateContent,
                    "Nội dung đánh giá không hợp lệ",
                ),
            );
        }
    }

    try {
        const rating = await upsertStoryRating({
            clientSubmissionId,
            formData: { stars, character, plot, world, content },
            storyId: Number(storyId),
            userId: session.user.id,
        });
        return {
            success: true,
            message: "Cảm ơn bạn đã đánh giá",
            rating,
        };
    } catch (err) {
        console.error("[story-activity] Không thể lưu đánh giá", err);
        return {
            success: false,
            error: getPublicActivityErrorMessage(
                err,
                "Không thể lưu đánh giá. Vui lòng thử lại.",
            ),
        };
    }
}

function validateCommentContent(formData) {
    const result = FormCommentValidate.safeParse({
        content: formData?.content,
    });
    if (!result.success) {
        return getValidationMessage(result, "Nội dung bình luận không hợp lệ");
    }
    return null;
}

async function createRatingCommentAction({
    clientSubmissionId,
    formData,
    ratingId,
    commentId,
}) {
    const session = await auth();
    if (!session) {
        return { success: false, error: "Bạn chưa đăng nhập" };
    }
    const submissionError = invalidSubmissionResponse(clientSubmissionId);
    if (submissionError) return submissionError;
    const error = validateCommentContent(formData);
    if (error) return { success: false, error };

    try {
        const newComment = await createRatingComment({
            clientSubmissionId,
            commentId: commentId ? Number(commentId) : null,
            content: formData.content,
            ratingId: Number(ratingId),
            userId: session.user.id,
        });
        return {
            success: true,
            newComment,
            message: "Cảm ơn bạn đã phản hồi",
        };
    } catch (err) {
        console.error("[story-activity] Không thể tạo bình luận đánh giá", err);
        return {
            success: false,
            error: getPublicActivityErrorMessage(
                err,
                "Không thể gửi bình luận. Vui lòng thử lại.",
            ),
        };
    }
}

async function createStoryDiscussionAction({
    clientSubmissionId,
    formData,
    storyId,
}) {
    const session = await auth();
    if (!session) {
        return { success: false, error: "Bạn chưa đăng nhập" };
    }
    const submissionError = invalidSubmissionResponse(clientSubmissionId);
    if (submissionError) return submissionError;
    const error = validateCommentContent(formData);
    if (error) return { success: false, error };

    try {
        const newComment = await createStoryDiscussion({
            clientSubmissionId,
            content: formData.content,
            storyId: Number(storyId),
            userId: session.user.id,
        });
        return {
            success: true,
            newComment,
            message: "Cảm ơn bạn đã phản hồi",
        };
    } catch (err) {
        console.error("[story-activity] Không thể tạo thảo luận", err);
        return {
            success: false,
            error: getPublicActivityErrorMessage(
                err,
                "Không thể tạo thảo luận. Vui lòng thử lại.",
            ),
        };
    }
}

async function createDiscussionReplyAction({
    clientSubmissionId,
    commentId,
    formData,
    rootCommentId,
    storyId,
}) {
    const session = await auth();
    if (!session) {
        return { success: false, error: "Bạn chưa đăng nhập" };
    }
    const submissionError = invalidSubmissionResponse(clientSubmissionId);
    if (submissionError) return submissionError;
    const error = validateCommentContent(formData);
    if (error) return { success: false, error };
    if (!commentId || !rootCommentId) {
        return { success: false, error: "Thiếu thông tin thread thảo luận" };
    }

    try {
        const newComment = await createDiscussionReply({
            clientSubmissionId,
            commentId: Number(commentId),
            content: formData.content,
            rootCommentId: Number(rootCommentId),
            storyId: Number(storyId),
            userId: session.user.id,
        });
        return {
            success: true,
            newComment,
            message: "Cảm ơn bạn đã phản hồi",
        };
    } catch (err) {
        console.error("[story-activity] Không thể trả lời thảo luận", err);
        return {
            success: false,
            error: getPublicActivityErrorMessage(
                err,
                "Không thể gửi trả lời. Vui lòng thử lại.",
            ),
        };
    }
}

async function setStoryActivityLike({ target, targetId, liked }) {
    const session = await auth();
    if (!session) {
        return {
            success: false,
            error: "Bạn chưa đăng nhập",
        };
    }

    try {
        const result = await prisma.$transaction((tx) =>
            setActivityLikeState({
                tx,
                userId: session.user.id,
                target,
                targetId,
                liked,
            }),
        );

        return {
            success: true,
            ...result,
        };
    } catch (err) {
        console.log("Internation Error::::", err);
        throw new Error(err?.message);
    }
}

async function updateUser({ userId, nameAccount, year, sex }) {
    const session = await auth();
    if (!session) throw new Error("Bạn chưa đăng nhập");

    if (userId !== session.user.id)
        throw new Error("Bạn không có quyền cập nhật thông tin");

    try {
        const updated = await prisma.$transaction(async (tx) => {
            return await tx.user.update({
                where: {
                    id: userId,
                },
                data: {
                    name: nameAccount,
                    birthYear: Number(year),
                    sex: sex ? sex : null,
                },
            });
        });
        console.log("updated infor user hjeh eh e:::", updated);
        if (updated) {
            return {
                success: true,
                updated,
            };
        }
    } catch (error) {
        console.warn("ERROR HE HE HE AT UPDATEUSER ACTION:", error);
        throw new Error("ERROR AT UPDATEUSER ACTION:::", error);
    }
}

async function updateUserLibrarySettingsAction(input) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Bạn chưa đăng nhập" };
    }

    const parsed = UserLibrarySettingsSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: "Cài đặt không hợp lệ" };
    }

    try {
        const settings = await prisma.userSetting.upsert({
            where: { userId: session.user.id },
            create: {
                userId: session.user.id,
                ...parsed.data,
            },
            update: parsed.data,
            select: {
                sortReading: true,
                sortMarked: true,
                notifyGeneral: true,
            },
        });

        return {
            success: true,
            message: "Đã lưu cài đặt tủ truyện",
            settings,
        };
    } catch (error) {
        console.error("[user-settings] Không thể cập nhật cài đặt", error);
        return {
            success: false,
            error: "Không thể lưu cài đặt. Vui lòng thử lại.",
        };
    }
}

export {
    createDiscussionReplyAction,
    createRatingCommentAction,
    createStoryDiscussionAction,
    upsertStoryRatingAction,
    setStoryActivityLike,
    updateUser,
    updateUserLibrarySettingsAction,
};
