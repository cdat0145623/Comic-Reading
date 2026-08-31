import { useEffect, useRef, useState } from "react";

function useFetchWithMinLoading(
    fetchFn,
    deps = [],
    minLoadingTime = 500,
    enabled = true
) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const isMounted = useRef(true);

    useEffect(() => {
        // console.log("enabled reading::", enabled);
        if (!enabled) return;

        isMounted.current = true;
        const start = Date.now();
        setLoading(true);

        async function loadStories() {
            try {
                const result = await fetchFn();
                // console.log("result::", result);
                const elapsed = Date.now() - start;
                const remaining = Math.max(0, minLoadingTime - elapsed);

                setTimeout(() => {
                    if (isMounted.current) {
                        setData(result?.data ?? result);
                        setLoading(false);
                    }
                }, remaining);
            } catch (e) {
                if (isMounted.current) {
                    console.error("Error fetching ❌: ", e);
                    setLoading(false);
                }
            }
        }

        loadStories();

        return () => {
            isMounted.current = false;
        };
    }, deps.concat(enabled));

    // console.log("useFetchWithMinLoading data:::::", data);

    return { data, loading };
}

export { useFetchWithMinLoading };
