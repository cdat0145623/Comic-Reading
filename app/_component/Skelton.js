export function Skeleton({ section }) {
    const Skeleton = ({ className = "" }) => (
        <div
            className={`relative overflow-hidden bg-gray-300 rounded ${className}`}
        >
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        </div>
    );

    if (section === "reading") {
        return (
            <div className="grid">
                <div className="grid grid-cols-12 gap-1 py-4 px-3">
                    <div className="hidden md:block md:col-span-1">
                        <Skeleton className="h-2 w-3/4" />
                    </div>

                    <div className="col-span-12 md:col-span-8 sm:col-span-9">
                        <Skeleton className="h-2 w-3/4" />
                    </div>

                    <div className="col-span-11 sm:col-span-2 flex justify-start sm:justify-center">
                        <Skeleton className="h-2 w-1/2 sm:w-2/3  " />
                    </div>

                    <div className="col-span-1 justify-self-end">
                        <Skeleton className="h-2 w-6" />
                    </div>
                </div>
            </div>
        );
    }

    if (section === "recommend") {
        return (
            <div className="flex pt-3 px-3 space-x-3 md:mr-5 mb-8">
                <div className="flex-shrink-0">
                    <Skeleton className="h-32 w-24 bg-gray-300 rounded" />
                </div>

                <div className="flex flex-wrap flex-col space-y-2 flex-1">
                    <Skeleton className="h-5 w-full bg-gray-300 rounded" />

                    <div className="space-y-1 mt-2">
                        <Skeleton className="h-4 w-full bg-gray-200 rounded" />
                        <Skeleton className="h-4 w-5/6 bg-gray-200 rounded" />
                    </div>

                    <div className="flex space-x-2 mt-2 items-center justify-between w-full">
                        <div className="flex items-center space-x-2 w-full">
                            <Skeleton className="w-4 h-4 rounded-full bg-gray-300" />
                            <Skeleton className="h-4 w-1/3 rounded bg-gray-300" />
                        </div>
                        <Skeleton className="w-1/6 h-6 bg-gray-300 rounded" />
                    </div>
                </div>
            </div>
        );
    }

    if (section === "chapterUpdated") {
        return (
            // <div className="grid">

            // </div>
            <div className="grid grid-cols-12 px-2 py-3 gap-2">
                <div className="col-span-12 sm:col-span-6">
                    <Skeleton className="h-2 w-2/3 sm:w-full md:w-5/6" />
                </div>

                <div className="flex items-center col-span-6 sm:hidden md:block md:col-span-2">
                    <Skeleton className="h-2 w-3/4 md:ml-auto" />
                </div>

                <div className="flex items-center col-span-6 w-full sm:col-span-3 md:col-span-2">
                    <Skeleton className="h-2 w-1/3 ml-auto  sm:w-2/3" />
                </div>

                <div className="flex items-center col-span-6 sm:hidden lg:block lg:col-span-1 lg:order-first lg:w-full">
                    <Skeleton className="h-2 w-3/4  " />
                </div>

                <div className="flex items-center col-span-6 w-full sm:col-span-3 md:col-span-2 lg:col-span-1">
                    <Skeleton className="h-2 w-1/3 ml-auto sm:w-2/3 md:w-1/3 lg:w-3/4" />
                </div>
            </div>
        );
    }

    if ((section = "chapter")) {
        return (
            <div className="col-span-1 space-y-1 pb-2 border-b text-primary border-slate-200">
                <div className="font-medium md:text-base text-sm">
                    <Skeleton className="h-3 w-4/5" />
                </div>
                <div className="flex items-center text-gray-400">
                    <Skeleton className="h-2 w-2/3" />
                </div>
            </div>
        );
    }
}
