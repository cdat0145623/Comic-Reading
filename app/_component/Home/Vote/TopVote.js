import SectionLink from "../../SectionLink";
import { Suspense } from "react";
import ListTopVote from "./ListTopVote";
import Spinner from "../../Spinner";

async function TopVote() {
    return (
        <div className="lg:cols-span-1">
            <SectionLink title="Top đề cử" href="/xep-hang/de-cu" icon />
            <Suspense fallback={<Spinner />}>
                <ListTopVote />
            </Suspense>
        </div>
    );
}

export default TopVote;
