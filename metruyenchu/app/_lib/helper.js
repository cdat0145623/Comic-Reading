"use client";

import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { fetchRatings } from "./api";
import { getRatingListParams, ratingKeys } from "./story-activity-query";

function formatRatingContent(rating) {
    const fields = [
        {
            key: "character",
            label: "Nhân vật",
        },
        {
            key: "plot",
            label: "Cốt truyện",
        },
        {
            key: "world",
            label: "Bối cảnh thế giới",
        },
    ];

    let fieldsContent = [];
    let hasSpecialFields = false;

    for (const field of fields) {
        if (rating[field.key]) {
            hasSpecialFields = true;

            let content = rating[field.key];

            if (!content.startsWith(field.label)) {
                content = `${field.label}: ${content}`;
            }

            fieldsContent.push(content);
        }
    }

    let specialFieldContent = fieldsContent.join("\n\n");

    let result = specialFieldContent;
    if (rating.content) {
        if (hasSpecialFields) {
            result += "\n\n" + rating.content;
        } else {
            result = rating.content;
        }
    }

    return result.trimEnd() || "Không có đánh giá chi tiết";
}

function timeAgo(date) {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: vi });
}

function sortLatest(arr, count) {
    const latest = [...arr].sort((a, b) => b.number - a.number);
    return latest.slice(0, count);
}

function handleSentences(str) {
    return str.split(/(?<=[.!?])\s+/);
}

function setParams(params, entries) {
    for (const [key, value] of Object.entries(entries)) {
        params.set(key, value);
    }
}

async function waitForElementById(id, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const interval = 100;
        let elapsed = 0;

        const check = () => {
            const el = document.getElementById(id);
            if (el) {
                resolve(el);
            } else {
                elapsed += interval;
                if (elapsed > timeout) {
                    reject("Element not found!!!");
                } else {
                    setTimeout(check, interval);
                }
            }
        };
        check();
    });
}

function isLikedByCurrentUser(likesArray, userId) {
    return likesArray?.some((item) => item.userId === userId);
}

function insertReplyRecursively(comments, newComment) {
    return comments.map((c) => {
        if (c.id === newComment.parentId) {
            return {
                ...c,
                replies: [...(c.replies || []), newComment],
            };
        }

        if (c.replies && c.replies.length > 0) {
            return {
                ...c,
                replies: insertReplyRecursively(c.replies, newComment),
            };
        }
        return c;
    });
}

function getRatingsQueryKey({ storyId, pageSize, sortOption, isDisplayAll }) {
    return ratingKeys.list({ storyId, pageSize, sortOption, isDisplayAll });
}

const fetchRatingsByKey = ({ queryKey, pageParam }) => {
    const params = getRatingListParams(queryKey);

    return fetchRatings({
        ...params,
        paginationCursor: pageParam,
        active: "ratings",
    });
};

function makeStateKey({ active, rootId, storyId, ratingId }) {
    if (active === "ratings") return `ratingComments:${ratingId}`;
    return `comments:${storyId}:${rootId}`;
}

function getFrameSrc(points) {
    if (points < 1000) return "/khung-de-tu.png";
    if (points < 10000) return "/khung-da-chu.png";
    if (points < 30000) return "/khung-duong-chu.png";
    if (points < 50000) return "/khung-ho-phap.png";
    return "/khung-truong-lao.png";
}

function selectedTag(tags) {
    const groupSlugs = [
        "tinh-trang",
        "the-loai",
        "tinh-cach-nhan-vat-chinh",
        "boi-canh-the-gioi",
        "luu-phai",
    ];

    const groupSlugsSet = new Set(groupSlugs);
    if (!tags.length) return;
    const filteredTags = tags
        .filter((tag) => groupSlugsSet.has(tag.group.slug))
        .map((tag) => ({
            ...tag,
            color:
                tag.group.slug === "the-loai"
                    ? "text-primary border-primary"
                    : tag.group.slug === "tinh-trang"
                      ? "text-rose-700 border-rose-700"
                      : "text-emerald-700 border-emerald-700",
        }));
    return filteredTags;
}

// function sortItems(arr) {
//     if (!arr.length) return [];
//     return [...arr].sort(
//         (a, b) => a.createdAt.localeCompare(b.createdAt) || a.id - a.id
//     );
// }
// const replies = arr.flatMap((item) => item.replies || []);
// arr.forEach((item) => {
//     delete item.replies;
// });
function collect(arr) {
    if (!arr.length) return [];

    const merged = [
        ...arr.map(({ replies, ...rest }) => rest),
        ...arr.flatMap((item) => item.replies || []),
    ];

    return merged.sort(
        (a, b) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id,
    );
}

function breakSentences(title, content) {
    const formatedContent = content.replace(/([.!?…])\s+/g, "$1\n\n").trim();

    return `${title}\n\n${formatedContent}`;
}

function sortByReaderCount(arr, order = "desc") {
    return arr.sort((a, b) => {
        if (order === "asc") {
            return a.readerCount - b.readerCount;
        } else {
            return b.readerCount - a.readerCount;
        }
    });
}

const generateImageUrl = (imageUrl, updatedAt) => {
    const time = new Date(updatedAt).getTime();
    // console.log(
    //     `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_200/${imageUrl}?t=${time}`,
    // );
    // return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_200/${imageUrl}?t=${time}`;
    return `${imageUrl}?t=${time}`;
};

export {
    sortByReaderCount,
    breakSentences,
    selectedTag,
    getFrameSrc,
    formatRatingContent,
    timeAgo,
    sortLatest,
    handleSentences,
    setParams,
    waitForElementById,
    isLikedByCurrentUser,
    insertReplyRecursively,
    getRatingsQueryKey,
    fetchRatingsByKey,
    makeStateKey,
    collect,
    generateImageUrl,
};
