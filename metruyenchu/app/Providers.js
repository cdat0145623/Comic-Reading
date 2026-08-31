"use client";
import {
    isServer,
    QueryClient,
    QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createContext, useContext } from "react";

const BenchmarkVariantContext = createContext("tanstack");

function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 60 * 1000,
            },
        },
    });
}

let browserQueryClient = undefined;

function getQueryClient() {
    if (isServer) {
        return makeQueryClient();
    } else {
        if (!browserQueryClient) browserQueryClient = makeQueryClient();
        return browserQueryClient;
    }
}

export function useBenchmarkVariant() {
    return useContext(BenchmarkVariantContext);
}

export default function Providers({ children, benchmarkVariant = "tanstack" }) {
    const queryClient = getQueryClient();

    return (
        <BenchmarkVariantContext.Provider value={benchmarkVariant}>
            <QueryClientProvider client={queryClient}>
                {children}
                <ReactQueryDevtools initialIsOpen={false} />
            </QueryClientProvider>
        </BenchmarkVariantContext.Provider>
    );
}
