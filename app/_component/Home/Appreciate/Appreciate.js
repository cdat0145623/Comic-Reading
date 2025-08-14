import { Suspense } from "react";
import SectionLink from "../../SectionLink";
import Spinner from "../../Spinner";
import { getRatingsQueryKey } from "@/app/_lib/helper-server";
import GenericSection from "../../Appreciated/GenericSection";

function Appreciate() {
    const queryKey = getRatingsQueryKey({ pageSize: 4, sortOption: "newest" });
    return (
        <div className="mt-5">
            <SectionLink title="Đánh giá mới" href="/danh-gia" icon />
            <Suspense fallback={<Spinner />}>
                <GenericSection queryKey={queryKey} pageSize={4} />
            </Suspense>
        </div>
    );
}

export default Appreciate;
