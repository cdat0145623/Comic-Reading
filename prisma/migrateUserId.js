import { PrismaClient } from "../app/generated/prisma/index.js";
import { customAlphabet } from "nanoid";

const prisma = new PrismaClient();
const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 21);

async function main() {
    const users = await prisma.user.findMany();
    for (const user of users) {
        const cuid = nanoid(); // tạo id giống như cuid()
        await prisma.user.update({
            where: { id: user.id },
            data: { id_new: cuid },
        });
    }
}

main().then(() => {
    console.log("✅ Migrated id → id_new");
    prisma.$disconnect();
});
