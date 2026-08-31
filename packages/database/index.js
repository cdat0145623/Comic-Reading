import { PrismaClient } from "./generated/client/index.js";

const globalForPrisma = globalThis;

export const prisma =
    globalForPrisma.mtcPrisma ||
    new PrismaClient({
        log:
            process.env.NODE_ENV === "development"
                ? ["warn", "error"]
                : ["error"],
    });

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.mtcPrisma = prisma;
}
