import { assertSourceAdapter } from "../../domain/source-adapter.js";
import { ImportDiscoveryError } from "../../domain/errors.js";
import { createTruyenDichLiveSourceAdapter } from "./truyendich/adapter.js";

export { assertSourceAdapter };

export function createDefaultSourceRegistry() {
    return createSourceRegistry([createTruyenDichLiveSourceAdapter()]);
}

export const defaultSourceRegistry = createDefaultSourceRegistry();

export function createSourceRegistry(adapters = []) {
    const byProvider = new Map();

    function register(sourceAdapter) {
        assertSourceAdapter(sourceAdapter);
        if (byProvider.has(sourceAdapter.provider)) {
            throw new ImportDiscoveryError(
                "SOURCE_ADAPTER_CONFLICT",
                `Source adapter ${sourceAdapter.provider} đã được đăng ký.`,
                { category: "CONFLICT" },
            );
        }
        byProvider.set(sourceAdapter.provider, sourceAdapter);
        return sourceAdapter;
    }

    function resolve(url) {
        for (const sourceAdapter of byProvider.values()) {
            if (sourceAdapter.canHandle(url)) return sourceAdapter;
        }
        throw new ImportDiscoveryError(
            "UNSUPPORTED_SOURCE",
            "Không có source adapter phù hợp với URL này.",
            { category: "VALIDATION" },
        );
    }

    for (const sourceAdapter of adapters) register(sourceAdapter);

    return {
        register,
        resolve,
        get(provider) {
            return byProvider.get(provider) || null;
        },
        list() {
            return [...byProvider.values()];
        },
    };
}
