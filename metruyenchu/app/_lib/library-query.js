const libraryKeys = {
    all: (userId) => ["library", userId],
    list: ({ userId, tab, page, sort }) => [
        "library",
        userId,
        "list",
        { tab, page, sort },
    ],
};

async function parseLibraryResponse(response, fallbackMessage) {
    const data = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error(data?.message || fallbackMessage);
    }
    return data;
}

async function fetchLibraryPage({ tab, page, sort }) {
    const query = new URLSearchParams({ tab, page: String(page), sort });
    const response = await fetch(`/api/library?${query}`);
    return parseLibraryResponse(response, "Không thể tải Tủ truyện");
}

async function removeLibraryStory({ tab, storyId }) {
    const scope = tab === "reading" ? "reading" : "bookmarks";
    const response = await fetch(`/api/library/${scope}/${storyId}`, {
        method: "DELETE",
    });
    return parseLibraryResponse(response, "Không thể xóa truyện khỏi danh sách");
}

async function updateStorySubscription({ storyId, enabled }) {
    const response = await fetch(`/api/library/subscriptions/${storyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
    });
    return parseLibraryResponse(response, "Không thể cập nhật thông báo");
}

export {
    fetchLibraryPage,
    libraryKeys,
    removeLibraryStory,
    updateStorySubscription,
};
