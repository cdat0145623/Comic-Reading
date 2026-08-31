import { prisma } from "@/lib/prisma";
import {
    buildCursorFilter,
    createCursorFromItem,
} from "./helper-server";
import { auth } from "@/lib/auth";

const chronologicalOrder = [{ createdAt: "asc" }, { id: "asc" }];

function paginate(items, pageSize, orderBy) {
    const hasMore = items.length > pageSize;
    const results = hasMore ? items.slice(0, pageSize) : items;
    return {
        results,
        nextCursor: hasMore
            ? createCursorFromItem(results[results.length - 1], orderBy)
            : undefined,
    };
}

async function getRatingComments({ ratingId, paginationCursor, pageSize }) {
    const currentUserId = (await auth())?.user?.id;
    const comments = await prisma.ratingComment.findMany({
        where: {
            ratingId,
            ...(paginationCursor
                ? buildCursorFilter(paginationCursor, chronologicalOrder)
                : {}),
        },
        orderBy: chronologicalOrder,
        take: pageSize + 1,
        select: {
            id: true,
            content: true,
            createdAt: true,
            updatedAt: true,
            ratingId: true,
            parentId: true,
            user: {
                select: { id: true, name: true },
            },
            parent: {
                select: {
                    user: {
                        select: { id: true, name: true },
                    },
                },
            },
            userLikes: {
                where: { userId: currentUserId ?? "" },
                select: { userId: true },
            },
            _count: {
                select: { userLikes: true },
            },
        },
    });
    const { results, nextCursor } = paginate(
        comments,
        pageSize,
        chronologicalOrder,
    );
    return { comments: results, nextCursor };
}

function getDiscussionOrder(sortOption) {
    if (sortOption === "mostLiked") {
        return [{ likeCount: "desc" }, { id: "desc" }, { createdAt: "desc" }];
    }
    if (sortOption === "oldest") {
        return chronologicalOrder;
    }
    return [{ createdAt: "desc" }, { id: "desc" }];
}

async function getStoryDiscussions({
    storyId,
    rootCommentId,
    sortOption,
    paginationCursor,
    pageSize,
}) {
    const currentUserId = (await auth())?.user?.id;
    const isThread = Boolean(rootCommentId);
    const orderBy = isThread
        ? chronologicalOrder
        : getDiscussionOrder(sortOption);
    const discuss = await prisma.discuss.findMany({
        where: {
            storyId,
            ...(isThread
                ? { threadRootId: rootCommentId }
                : { parentId: null }),
            ...(paginationCursor
                ? buildCursorFilter(paginationCursor, orderBy)
                : {}),
        },
        orderBy,
        take: pageSize + 1,
        select: {
            id: true,
            content: true,
            parentId: true,
            threadRootId: true,
            createdAt: true,
            likeCount: true,
            likes: {
                where: { userId: currentUserId ?? "" },
                select: { userId: true },
            },
            _count: {
                select: isThread
                    ? { likes: true }
                    : { likes: true, replies: true, threadItems: true },
            },
            user: {
                select: {
                    id: true,
                    name: true,
                    ...(!isThread
                        ? {
                              chaptersRead: {
                                  where: { chapter: { storyId } },
                                  orderBy: { readAt: "desc" },
                                  take: 1,
                                  select: {
                                      readAt: true,
                                      chapter: { select: { name: true } },
                                  },
                              },
                          }
                        : {}),
                },
            },
            parent: {
                select: {
                    user: {
                        select: { id: true, name: true },
                    },
                },
            },
            ...(!isThread
                ? {
                      story: {
                          select: {
                              id: true,
                              title: true,
                              slug: true,
                              chapters: {
                                  orderBy: { postedAt: "asc" },
                                  take: 1,
                                  select: { name: true },
                              },
                          },
                      },
                  }
                : {}),
        },
    });
    const { results, nextCursor } = paginate(discuss, pageSize, orderBy);
    return { discuss: results, nextCursor };
}

export { getRatingComments, getStoryDiscussions };
