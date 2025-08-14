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
    isDisplayAll = false,
}) {
    console.log(
        `ratingId: ${ratingId} active = ${active}, sortOption = ${sortOption}, paginationCursor = ${paginationCursor}, pageSize = ${pageSize} storyId = ${storyId}, isDisplayAll = ${isDisplayAll}`
    );

    const query = new URLSearchParams({
        pageSize,
        ...(paginationCursor
            ? { paginationCursor: JSON.stringify(paginationCursor) }
            : {}),
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

async function fetchChapters({ storyId, slug }) {
    const query = storyId ? `?storyId=${storyId}` : `?slug=${slug}`;
    const res = await fetch(`/api/story${query}`);
    if (!res.ok) throw new Error("❌ Failed to fetch Chapters!");
    console.log("res::", res);
    return await res.json();
}

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
    return responseData;
}

export { fetchReading, fetchTopStories, fetchRatings, fetchChapters, signUp };
