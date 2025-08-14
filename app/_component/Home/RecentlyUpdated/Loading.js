import { Skeleton } from "../../Skelton";

function Loading() {
    return Array.from({ length: 10 }).map((_, i) => (
        <Skeleton section="chapterUpdated" key={i} />
    ));
}

export default Loading;
