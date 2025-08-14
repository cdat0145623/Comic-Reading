import { Skeleton } from "./_component/Skelton";

export default function Loading() {
    return Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} />);
}
