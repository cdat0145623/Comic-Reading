import { ImportDiscoveryError } from "../../domain/errors.js";

export function assertSourceTransport(transport) {
    if (!transport || typeof transport.fetch !== "function") {
        throw new ImportDiscoveryError(
            "SOURCE_TRANSPORT_INVALID",
            "Source transport chưa triển khai fetch contract.",
            { category: "VALIDATION" },
        );
    }
    return transport;
}
