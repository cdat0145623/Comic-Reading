import { PrismaClient } from "../app/generated/prisma/index.js";

const prisma = new PrismaClient({ log: ["query", "info"] });

export async function main() {
    await prisma.$transaction(async (tx) => {
        await tx.user.updateMany({
            data: {
                updatedAt: new Date(),
            },
        });
    });
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
