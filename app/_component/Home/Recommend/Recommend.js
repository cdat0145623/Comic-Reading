import { Suspense } from "react";
import Recommends from "./Recommends";
import SectionLink from "../../SectionLink";
import Loading from "../../Loading";

export const revalidate = 1000;

function Recommend() {
    return (
        <>
            <div className="flex flex-wrap">
                <SectionLink
                    title="BTV đề cử"
                    href="/danh-sach/truyen-chon-loc"
                    icon
                />
                <Suspense
                    fallback={
                        <Loading
                            section="recommend"
                            length={6}
                            className="grid grid-cols-2 w-full"
                        />
                    }
                >
                    <Recommends />
                </Suspense>
            </div>
        </>
    );
}

export default Recommend;
