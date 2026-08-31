import { Suspense } from "react";

import Spinner from "@/app/_component/Spinner";
import SelecTime from "@/app/_component/SelecTime";
import VoteList from "@/app/_component/Vote/VoteList";
import SideBar from "@/app/_component/SideBar";

async function Page(props) {
    const searchParams = await props.searchParams;
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:px-0 px-4">
            <div className="md:col-span-2 space-y-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-primary uppercase text-sm">
                        Bảng Xếp Hạng Đề Cử
                    </h2>
                    <SelecTime />
                </div>
                <Suspense
                    fallback={<Spinner />}
                    key={`${searchParams?.month}-${searchParams?.year}-${searchParams?.page}`}
                >
                    <VoteList searchParams={searchParams} />
                </Suspense>
            </div>
            <SideBar />
        </div>
    );
}

export default Page;
