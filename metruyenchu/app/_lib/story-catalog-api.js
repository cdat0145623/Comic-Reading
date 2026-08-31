import { buildCatalogSearchParams } from "./story-catalog-query";

async function fetchStoryCatalog({ filters, cursor, pageSize, signal }) {
    const params = buildCatalogSearchParams(filters, {
        cursor,
        limit: pageSize,
    });
    const response = await fetch(`/api/stories?${params}`, { signal });
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data?.message || "Không thể tải danh sách truyện.");
    }

    return data;
}

export { fetchStoryCatalog };
