"use server";

import { prisma } from "@/lib/prisma";
import { auth, signIn, signOut } from "../../lib/auth-with-adapter";
import { FormCommentValidate, FormRatingValidate } from "./validate";
import { countTotalWorlds } from "./data-service";

async function createOrUpdateRating(formData, storyId, slug) {
    console.log("formData:", formData);
    console.log("storyId::", storyId);
    const { stars, character, plot, world, content } = formData;

    const session = await auth();

    if (!session) {
        return {
            success: false,
            error: "Bạn chưa đăng nhập",
        };
    }

    if (character || plot || world || content) {
        const validateContent = FormRatingValidate.safeParse({
            character,
            plot,
            world,
            content,
        });
        if (!validateContent.success) {
            const errorFieldContent =
                validateContent.error.flatten().fieldErrors;
            const messageError =
                errorFieldContent.content?.[0] || "Error not define!!!";

            throw new Error(messageError);
        }
    }
    try {
        const wordCount = countTotalWorlds(formData);
        const rating = await prisma.rating.upsert({
            where: {
                userId_storyId: {
                    userId: session.user.id,
                    storyId: storyId,
                },
            },
            update: {
                stars: parseFloat(stars),
                character,
                plot,
                world,
                content,
                wordCount,
            },
            create: {
                story: {
                    connect: {
                        id: storyId,
                    },
                },
                user: {
                    connect: {
                        id: session.user.id,
                    },
                },
                stars: parseFloat(stars),
                character,
                plot,
                world,
                content,
                wordCount,
            },
            include: {
                user: true,
            },
        });
        console.log("Slug server::", slug);

        console.log("New Rating at server", rating);
        // await new Promise((res) => setTimeout(res, 3000));
        if (rating) {
            // revalidatePath(`/truyen/${slug}`);
            return {
                success: true,
                message: "Cảm ơn bạn đã đánh giá",
                rating,
            };
        }
    } catch (err) {
        console.log("Internation Error::::", err);
        throw new Error(err?.message);
    }
}

async function createComment({
    formData,
    ratingId,
    commentId,
    storyId,
    active,
}) {
    const session = await auth();
    if (!session) {
        return {
            success: false,
            error: "Bạn chưa đăng nhập",
        };
    }
    const validateContent = FormCommentValidate.safeParse({
        content: formData.content,
    });

    if (!validateContent.success) {
        const errorFieldContent = validateContent.error.flatten().fieldErrors;
        const messageError =
            errorFieldContent.content?.[0] || "Error not define!!!";

        return {
            success: false,
            error: messageError,
        };
    }
    try {
        let newComment;
        if (active === "ratings" && ratingId) {
            newComment = await prisma.$transaction(async (tx) => {
                return await tx.ratingComment.create({
                    data: {
                        content: formData.content,
                        ratingId,
                        parentId: commentId ?? null,
                        userId: session.user.id,
                    },
                    include: {
                        user: true,
                        replies: true,
                    },
                });
            });
        } else {
            console.log("activeTabs:", active);
            console.log("create Discuss for story:", storyId);
            console.log("parentId for discuss", commentId);
            newComment = await prisma.$transaction(async (tx) => {
                return await tx.discuss.create({
                    data: {
                        content: formData.content,
                        storyId,
                        parentId: commentId ?? null,
                        userId: session.user.id,
                    },
                    include: {
                        user: true,
                        replies: true,
                    },
                });
            });
        }

        console.log("new comment he he:", newComment);
        if (newComment) {
            return {
                success: true,
                newComment,
                message: "Cảm ơn bạn đã phản hồi",
            };
        }
    } catch (err) {
        console.log("Internation Error::::", err);
        throw new Error(err?.message);
    }
}

async function toggleRatingLike({
    ratingId,
    commentId: ratingCommentId,
    active,
}) {
    console.log("ratingId::", ratingId);
    console.log("ratingCommentId::", ratingCommentId);
    const isCommentLike = !!ratingCommentId;
    const session = await auth();
    if (!session) {
        return {
            success: false,
            error: "Bạn chưa đăng nhập",
        };
    }
    let where;
    if (active === "comments") {
        where = {
            userId_discussId: {
                userId: session.user.id,
                discussId: ratingCommentId,
            },
        };
    } else {
        where = isCommentLike
            ? {
                  userId_ratingCommentId: {
                      userId: session.user.id,
                      ratingCommentId,
                  },
              }
            : {
                  userId_ratingId: {
                      userId: session.user.id,
                      ratingId,
                  },
              };
    }

    try {
        if (active === "comments") {
            const existingLike = await prisma.discussLike.findUnique({
                where,
            });
            if (existingLike) {
                const [discuss] = await prisma.$transaction([
                    prisma.discussLike.delete({
                        where,
                    }),
                    prisma.discuss.update({
                        where: {
                            id: ratingCommentId,
                        },
                        data: {
                            likeCount: {
                                decrement: 1,
                            },
                        },
                    }),
                ]);
                return {
                    success: true,
                    discussId: discuss.id,
                    message: "Bỏ like và update thành công Discuss",
                };
            } else {
                const [discuss] = await prisma.$transaction([
                    prisma.discussLike.create({
                        data: {
                            userId: session.user.id,
                            discussId: ratingCommentId,
                        },
                    }),
                    prisma.discuss.update({
                        where: {
                            id: ratingCommentId,
                        },
                        data: {
                            likeCount: {
                                increment: 1,
                            },
                        },
                    }),
                ]);
                return {
                    success: true,
                    discussId: discuss.id,
                    message:
                        "Đã tạo mới discussLike và update thành công Discuss",
                };
            }
        } else {
            if (isCommentLike) {
                const existingLike = await prisma.ratingCommentLike.findUnique({
                    where,
                });
                if (existingLike) {
                    const ratingComment = await prisma.ratingCommentLike.delete(
                        {
                            where,
                        }
                    );
                    return {
                        success: true,
                        commentId: ratingComment.id,
                        message: "Bỏ liked comment thành công",
                    };
                } else {
                    const ratingComment = await prisma.ratingCommentLike.create(
                        {
                            data: {
                                userId: session.user.id,
                                ratingCommentId,
                            },
                        }
                    );
                    return {
                        success: true,
                        commentId: ratingComment.id,
                        message: "Đã liked comment thành công",
                    };
                }
            } else {
                const existingLike = await prisma.ratingLike.findUnique({
                    where,
                });
                if (existingLike) {
                    const [rating] = await prisma.$transaction([
                        prisma.ratingLike.delete({
                            where,
                        }),
                        prisma.rating.update({
                            where: {
                                id: ratingId,
                            },
                            data: {
                                likeCount: {
                                    decrement: 1,
                                },
                            },
                        }),
                    ]);

                    return {
                        ratingId: rating.id,
                        success: true,
                        message:
                            "Xoá liked rating và updated likeCount success",
                    };
                } else {
                    const [rating] = await prisma.$transaction([
                        prisma.ratingLike.create({
                            data: {
                                userId: session.user.id,
                                ratingId,
                            },
                        }),
                        prisma.rating.update({
                            where: {
                                id: ratingId,
                            },
                            data: {
                                likeCount: {
                                    increment: 1,
                                },
                            },
                        }),
                    ]);
                    return {
                        ratingId: rating.id,
                        success: true,
                        message: "Đã liked rating và updated likeCount success",
                    };
                }
            }
        }
    } catch (err) {
        console.log("Internation Error::::", err);
        throw new Error(err?.message);
    }
}

async function signInAction() {
    await signIn("google");
}

async function signOutAction() {
    await signOut("google");
}

export {
    createOrUpdateRating,
    signInAction,
    signOutAction,
    createComment,
    toggleRatingLike,
};
