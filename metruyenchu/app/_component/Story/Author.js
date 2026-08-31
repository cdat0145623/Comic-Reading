import ChapterCard from "../Home/RecentlyUpdated/ChapterCard";
import SectionLink from "../SectionLink";

function Author({ story, storyId }) {
    const stories = story.author.stories.filter(
        (story) => story.id !== storyId
    );
    // console.log("Author List stories:", stories);
    return (
        <div>
            {stories.length > 1 && (
                <>
                    <SectionLink
                        title="Cùng tác giả"
                        text="xem thêm"
                        icon
                        background
                        className="px-3 py-2"
                        author={story.author.name}
                        href={`/tac-gia/${story.authorId}-${story.author.slug}`}
                    />
                    <div className="mt-5">
                        {stories.map((story, index) => {
                            const user = story.uploader.name;
                            const { title, totalChapters, tags, ...rest } =
                                story;
                            return (
                                <ChapterCard
                                    key={story.id}
                                    index={index}
                                    story={{
                                        title,
                                        totalChapters,
                                        tags,
                                        user,
                                    }}
                                />
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}

export default Author;
