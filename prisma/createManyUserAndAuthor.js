import { PrismaClient } from "../app/generated/prisma/index.js";
const prisma = new PrismaClient({ log: ["query", "info"] });

export async function main() {
    const users = Array.from({ length: 20 }).map((_, index) => ({
        name: `User${index + 38}`,
        email: `user${index + 38}@prisma.io`,
        password: `Kinbiutuser${index + 38}`,
        avatarUrl: "https://static.cdnno.com/user/default/200.jpg",
        birthYear: 2000 + index,
        setting: {
            create: {},
        },
    }));
    console.log("ArrayUser dont have seed into database::::::::::::", users);

    await prisma.user.createMany({
        data: users.map((user) => {
            const { setting, ...rest } = user;
            return rest;
        }),
    });

    // const authors = Array.from({ length: 5 }).map((_, index) => ({
    //     name: `Author ${index + 3}`,
    // }));
    // console.log(
    //     "ArrayAuthor dont have seed into database::::::::::::",
    //     authors
    // );
    // await prisma.author.createMany({ data: authors });

    console.log(`✅ Seeded ${users.length} users  into database`);

    // console.log(
    //     `✅ Seeded ${users.length} users and ${authors.length} authors into database`
    // );
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
