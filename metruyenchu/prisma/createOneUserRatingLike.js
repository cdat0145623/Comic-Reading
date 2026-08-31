import { PrismaClient } from "../app/generated/prisma/index.js";

const prisma = new PrismaClient({ log: ["query", "info"] });

const randomItem = (array) => array[Math.floor(Math.random() * array.length)];

function getRandomElements(arr, count) {
    const suffled = [...arr].sort(() => 0.5 - Math.random());
    return suffled.slice(0, count);
}

export async function main() {
    const ratingForStorys = await prisma.story.findMany({
        include: {
            ratings: true,
        },
    });
    console.log("For story get all ratings:", ratingForStorys);

    const selectedRating = ratingForStorys
        .map((groupRating) => randomItem(groupRating.ratings))
        .filter(Boolean);

    console.log("For Story only get one rating:", selectedRating);

    Promise.all(
        selectedRating.map((rating) =>
            prisma.ratingLike.create({
                data: {
                    userId: 13,
                    ratingId: rating.id,
                },
            })
        )
    );

    console.log(`✅ Seed completed`);
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
