import { PrismaClient } from "../app/generated/prisma/index.js";
import { v4 as uuidv4 } from "uuid";
const prisma = new PrismaClient({ log: ["query", "info"] });

async function createUserAndSetting() {
    const users = Array.from({ length: 100 }).map((_, index) => ({
        id: uuidv4(),
        name: `User${index + 1}`,
        email: `user${index + 1}@prisma.io`,
        password: `Kinbiutuser${index + 1}`,
        image: "https://static.cdnno.com/user/default/200.jpg",
        birthYear: 2000 + index,
    }));
    console.log("ArrayUser dont have seed into database::::::::::::", users);
    await prisma.user.createMany({
        data: users,
    });

    let getAllUsers = await prisma.user.findMany();

    console.log("All user from db::::::::::", getAllUsers);

    await prisma.userSetting.createMany({
        data: getAllUsers.map((user) => ({
            userId: user.id,
        })),
    });

    console.log("✅ Seeded all users with settings.");
}

export async function main() {
    await createUserAndSetting();
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
