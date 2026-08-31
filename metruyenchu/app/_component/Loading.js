import { Skeleton } from "./Skelton";

function Loading({ section, length, className = "" }) {
    return (
        <div className={`${className}`}>
            {Array.from({ length: length }).map((_, i) => (
                <Skeleton key={i} section={section} />
            ))}
        </div>
    );
}

export default Loading;
