import { PrismaClient } from "../app/generated/prisma/index.js";
import { LoremIpsum } from "lorem-ipsum";

const prisma = new PrismaClient({ log: ["query", "info"] });

function generateRandomRating() {
    const min = 3;
    const max = 5;
    const random = Math.random() * (max - min) + min;
    return Math.round(random * 10) / 10;
}

const lorem = new LoremIpsum({
    wordsPerSentence: { min: 3, max: 10 },
    sentencesPerParagraph: { min: 1, max: 3 },
});

function generateRandomWord(wordCount) {
    return wordCount
        ? lorem.generateWords(wordCount)
        : lorem.generateSentences(1);
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

async function createCharacterContent() {
    const user = await prisma.user.findUnique({
        where: {
            id: 1,
        },
        select: {
            id: true,
        },
    });
    // await prisma.rating.create({
    //     data: {
    //         stars: generateRandomRating(),
    //         content: generateTextWithSentences(100),
    //         character: generateRandomWord(),
    //         userId: user.id,
    //         storyId: 32,
    //     },
    // });
    // await prisma.rating.create({
    //     data: {
    //         stars: generateRandomRating(),
    //         plot: generateRandomWord(),
    //         userId: user.id,
    //         storyId: 33,
    //     },
    // });
    await prisma.rating.create({
        data: {
            stars: generateRandomRating(),
            content: generateTextWithSentences(100),
            character: generateRandomWord(),
            plot: generateRandomWord(),
            world: generateRandomWord(),
            userId: user.id,
            storyId: 35,
        },
    });
    console.log(`✅ Seed completed Story 30`);
    console.log("---------------------------------------------------");
}

export async function main() {
    await createCharacterContent();
    console.log("✅ Seed completed!");
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
