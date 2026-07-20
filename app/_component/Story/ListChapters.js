import ChapterCard from "./ChapterCard";

function ListChapters({ chapters = [], slug }) {
    if (!chapters.length) {
        return (
            <div className="pt-6 md:px-2 px-4 text-sm text-gray-400">
                Chưa có chương nào
            </div>
        );
    }

    return (
        <div className="pt-6 md:px-2 px-4 grid md:grid-cols-3 grid-cols-1 gap-4">
            {chapters.map((chapter) => (
                <ChapterCard chapter={chapter} key={chapter.id} slug={slug} />
            ))}
        </div>
    );
}

export default ListChapters;
