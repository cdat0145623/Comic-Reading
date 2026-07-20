import {
    getContinueChapterByStoryId,
    getReadChapterIdsByStoryId,
    getStoryChaptersById,
} from "@/app/_lib/data-service";
import { NextResponse } from "next/server";

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const storyId = searchParams.get("storyId");
    const scope = searchParams.get("scope");

    if (scope === "read-chapters") {
        const { chapterIds, error } =
            await getReadChapterIdsByStoryId(storyId);

        if (error) {
            console.log(
                "ERROR at Server Route getReadChapterIdsByStoryId",
                error,
            );

            return NextResponse.json(
                {
                    success: false,
                },
                { status: 500 },
            );
        }

        return NextResponse.json(chapterIds);
    }

    if (scope === "continue-chapter") {
        const { continueChapter, error } =
            await getContinueChapterByStoryId(storyId);

        if (error) {
            console.log(
                "ERROR at Server Route getContinueChapterByStoryId",
                error,
            );

            return NextResponse.json(
                {
                    success: false,
                },
                { status: 500 },
            );
        }

        return NextResponse.json(continueChapter);
    }

    const { story, error } = await getStoryChaptersById(Number(storyId));

    if (error) {
        console.log("ERROR at Server Route getChaptersByStoryId", error);

        return NextResponse.json(
            {
                success: false,
            },
            { status: 500 },
        );
    }
    return NextResponse.json(story?.chapters ?? []);
}

// import { getChaptersByStoryId, getStoryBySlug } from "@/app/_lib/data-service";
// import { NextResponse } from "next/server";

// export async function GET(req) {
//     const { searchParams } = new URL(req.url);
//     const storyId = searchParams?.get("storyId");
//     const slug = searchParams.get("slug");
//     let story;
//     let chapters;
//     try {
//         if (slug) {
//             story = await getStoryBySlug(slug);
//         } else {
//             chapters = await getChaptersByStoryId(storyId);
//         }
//         return NextResponse.json(chapters ?? story);
//     } catch (error) {
//         console.log("ERROR at Server Route getChaptersByStoryId", error);
//         return NextResponse.json(
//             {
//                 success: false,
//             },
//             { status: 500 }
//         );
//     }
// }

// try {
//     const { chapters } = await getChaptersByStoryId({
//         storyId: Number(storyId),
//     });
//     return NextResponse.json(chapters);
// } catch (error) {
//     console.log("ERROR at Server Route getChaptersByStoryId", error);
//     return NextResponse.json(
//         {
//             success: false,
//         },
//         { status: 500 }
//     );
// }
