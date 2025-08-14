import { Suspense } from "react";
import SectionLink from "../_component/SectionLink";
import Spinner from "../_component/Spinner";
import GenericSection from "../_component/Appreciated/GenericSection";
import { getRatingsQueryKey } from "../_lib/helper-server";

async function Page() {
    const queryKey = getRatingsQueryKey({ pageSize: 20, sortOption: "newest" });
    return (
        <div className="mt-6 space-y-5 lg:px-0 px-4">
            <SectionLink title="Đánh giá mới" primary />
            <Suspense fallback={<Spinner />}>
                <GenericSection queryKey={queryKey} pageSize={20} />
            </Suspense>
        </div>
    );
}

export default Page;
