// import { AppError } from "../../app/_lib/errors.js";
import { NextResponse } from "next/server";
import { AppError } from "./errors";
async function fetchReading(userId) {
    if (userId) {
        const res = await fetch(`/api/reading?userId=${userId}`);

        // console.log("res:", res);

        if (!res.ok) throw new Error("Failed to fetch Story");

        return await res.json();
    }
}

async function fetchTopStories(minutes, limit) {
    const query = minutes && limit ? `?minutes=${minutes}&limit=${limit}` : "";

    const res = await fetch(`/api/top-stories${query}`);

    // console.log("res:::::", res);

    if (!res.ok) throw new Error("❌ Failed to fetch TOP Stories!");

    return await res.json();
}

async function fetchRatings({
    active = "ratings",
    sortOption = "newest",
    paginationCursor,
    pageSize = 10,
    storyId,
    ratingId,
    rootCommentId,
    isDisplayAll = false,
}) {
    console.log(
        `ratingId: ${ratingId} active = ${active}, sortOption = ${sortOption}, paginationCursor = ${paginationCursor}, pageSize = ${pageSize} storyId = ${storyId}, isDisplayAll = ${isDisplayAll}`,
    );

    const query = new URLSearchParams({
        pageSize,
        ...(paginationCursor
            ? { paginationCursor: JSON.stringify(paginationCursor) }
            : {}),
        ...(rootCommentId ? { rootCommentId } : {}),
        ...(ratingId
            ? { ratingId, storyId }
            : {
                  ...(storyId !== undefined ? { storyId } : {}),
                  ...(storyId !== undefined && active === "ratings"
                      ? {
                            sortOption,
                            isDisplayAll,
                        }
                      : active === "comments"
                        ? {
                              sortOption,
                          }
                        : {}),
              }),
    }).toString();

    const isServer = typeof window === "undefined";
    const baseURL = isServer
        ? process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
        : "";

    const res = await fetch(`${baseURL}/api/${active}?${query}`);

    if (!res.ok) throw new Error("❌ Failed to fetch Ratings!");

    return await res.json();
}

async function fetchChapters({ storyId }) {
    const res = await fetch(`/api/story?storyId=${storyId}`);
    if (!res.ok) throw new Error("❌ Failed to fetch Chapters!");
    console.log("res::", res);
    return await res.json();
}

async function fetchStorySearch({ query, signal }) {
    const searchParams = new URLSearchParams({
        q: query,
        limit: "5",
    });
    const res = await fetch(`/api/search/stories?${searchParams}`, { signal });
    const data = await res.json();

    if (!res.ok) {
        throw new Error(data?.message || "Không thể tìm kiếm truyện.");
    }

    return data;
}

async function fetchReadChapterIds({ storyId }) {
    const res = await fetch(`/api/story?storyId=${storyId}&scope=read-chapters`);
    if (!res.ok) throw new Error("❌ Failed to fetch read chapters!");
    return await res.json();
}

async function fetchContinueChapter({ storyId }) {
    const res = await fetch(
        `/api/story?storyId=${storyId}&scope=continue-chapter`,
    );
    if (!res.ok) throw new Error("❌ Failed to fetch continue chapter!");
    return await res.json();
}

async function fetchChapterDetail({ slug, number }) {
    const query = new URLSearchParams({
        slug,
        number,
    }).toString();

    const res = await fetch(`/api/chapter?${query}`);
    if (!res.ok) throw new Error("❌ Failed to fetch chapter detail!");
    return await res.json();
}

async function recordChapterRead({ storyId, chapterId }) {
    const res = await fetch("/api/chapter/read", {
        method: "POST",
        body: JSON.stringify({
            storyId,
            chapterId,
        }),
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!res.ok) throw new Error("❌ Failed to record chapter read!");
    return await res.json();
}

// async function fetchChapters({ storyId, slug }) {
//     const query = storyId ? `?storyId=${storyId}` : `?slug=${slug}`;
//     const res = await fetch(`/api/story${query}`);
//     if (!res.ok) throw new Error("❌ Failed to fetch Chapters!");
//     console.log("res::", res);
//     return await res.json();
// }

async function signUp(email, password) {
    let res;
    if (email && password) {
        res = await fetch("/api/signUp", {
            method: "POST",
            body: JSON.stringify({ email, password }),
            headers: { "Content-Type": "application/json" },
        });
    }

    const responseData = await res.json();

    if (!res.ok) {
        console.log("responseData::", responseData);
        const firstMessage =
            Object.values(responseData?.error || {}).flat()[0] ||
            responseData?.message ||
            "SignUp Failed";

        throw new AppError(firstMessage, res.status, responseData?.error);
    }
    return responseData.user;
}

async function updateImageUser(newImage, oldImage, userId) {
    try {
        console.log("update Image:::::", newImage);
        console.log("old image::", oldImage);

        let result, data, existImage;
        existImage = !!oldImage;
        console.log("existImage at POST /api/user:::", existImage);
        //create signature
        const res = await fetch("/api/user", {
            method: "POST",
            body: JSON.stringify({
                existImage,
                userId,
            }),
            headers: { "Content-Type": "application/json" },
        });

        const { signature, timestamp, apiKey, cloudName, public_id } =
            await res.json();
        console.log("signature 2 from server:::", signature);
        const formData = new FormData();
        console.log(
            `${existImage ? "public_id" : "newImage"}: `,
            existImage ? oldImage : newImage,
        );
        if (existImage) {
            formData.append("overwrite", "true");
        } else {
            formData.append("folder", folder);
        }
        formData.append("public_id", public_id);
        formData.append("file", newImage);
        formData.append("api_key", apiKey);
        formData.append("timestamp", timestamp);
        formData.append("signature", signature);

        //upload Image to cloudinary
        result = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            {
                method: "POST",
                body: formData,
            },
        );
        result = await result.json();
        if (result?.error) throw new Error(result.error?.message);
        // console.log("error at upload to cloudinary", result.error);

        console.log("result after update image to cloudinary::", result);

        // const { public_id: newImageUrl } = result;
        const { secure_url } = result;

        console.log("secure_url newImage upload to cloudinary::", secure_url);

        console.log("newImage:::", newImage);
        console.log("public_id:::", oldImage);

        //create or update public_id (url_image) in database
        data = await fetch(`/api/user/${userId}`, {
            method: "PATCH",
            body: JSON.stringify({
                imageUrl: secure_url,
            }),
            headers: { "Content-Type": "application/json" },
        }).then((res) => res.json());

        console.log("Data result of updateImageUser:::::", data);
        return {
            data,
            ok: true,
        };
    } catch (error) {
        // console.log("ERROR at update Image at client before callAPI::", error);
        throw new Error(error.message);
    }
}

export {
    fetchReading,
    fetchTopStories,
    fetchRatings,
    fetchChapters,
    fetchStorySearch,
    fetchReadChapterIds,
    fetchContinueChapter,
    fetchChapterDetail,
    recordChapterRead,
    signUp,
    updateImageUser,
};
