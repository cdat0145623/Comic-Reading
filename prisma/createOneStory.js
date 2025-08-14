import prisma from "../lib/prisma.js";
import slugify from "slugify";
import { LoremIpsum } from "lorem-ipsum";

const lorem = new LoremIpsum({
    wordsPerSentence: { min: 3, max: 10 },
    sentencesPerParagraph: { min: 3, max: 6 },
});
function generateRandomContent(wordCount = 500) {
    return lorem.generateWords(wordCount);
}

function generateTextWithSentences(wordCount = 500) {
    const words = lorem.generateWords(wordCount).split(" ");
    const sentences = [];
    let i = 0;

    while (i < words.length) {
        const sentenceLength = Math.floor(Math.random() * 8) + 3;
        const sentenceWords = words.slice(i, i + sentenceLength);

        if (sentenceWords.length === 0) break;

        sentenceWords[0] =
            sentenceWords[0][0].toUpperCase() + sentenceWords[0].slice(1);

        const sentence = sentenceWords.join(" ") + ".";
        sentences.push(sentence);

        i += sentenceLength;
    }
    return sentences.join(" ");
}

const storyData = [
    {
        title: "Độc Bộ Thành Tiên 5",
        stringUrl:
            "https://static.cdnno.com/poster/hao-huu-tu-vong-ta-tu-vi-lai-tang-len/300.jpg?1642214772",
        totalChapters: 50,
        uploader: {
            connect: {
                id: 17,
            },
        },
        author: {
            connect: {
                id: 3,
            },
        },
    },
];

export async function main() {
    // const storys = await prisma.story.findMany();

    // for (const story of storys) {
    //     const introduce = lorem.generateParagraphs(1);
    //     const result = await prisma.story.updateMany({
    //         where: { introduce: null },
    //         data: {
    //             introduce: introduce,
    //         },
    //     });
    //     console.log(`Updated ${result.count} for ${story.id}`);
    // }

    const uploadedUserIds = new Set();
    for (const story of storyData) {
        const uploaderId = story.uploader.connect.id;
        const chapters = Array.from(
            { length: story.totalChapters },
            (_, i) => ({
                name: `Chương ${i + 1}`,
                number: i + 1,
                content: generateTextWithSentences(500),
            })
        );
        const data = {
            title: story.title,
            stringUrl: story.stringUrl,
            totalChapters: story.totalChapters,
            slug: slugify(story.title, { lower: true, strict: true }),
            uploader: story.uploader,
            author: story.author,
            introduce: lorem.generateParagraphs(1),
            chapters: {
                create: chapters,
            },
        };
        // console.log(JSON.stringify(data, null, 2));
        await prisma.story.create({ data });
        if (!uploadedUserIds.has(uploaderId)) {
            const uploader = await prisma.user.findUnique({
                where: { id: uploaderId },
                select: { role: true },
            });
            // console.log("uploader::::::::", uploader);
            if (uploader.role !== "UPLOADER") {
                console.log("This user is not UPLOADER ☠️");
                await prisma.user.update({
                    where: { id: uploaderId },
                    data: { role: "UPLOADER" },
                });
            }
            uploadedUserIds.add(uploaderId);
        }
    }
}

main()
    .catch((e) => {
        console.error("❌ Seeding failed:", e);
        process.exit(1);
    })
    .finally(() => {
        prisma.$disconnect();
        console.log("✅ Prisma client disconnected");
    });
