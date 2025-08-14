// import { PrismaClient } from "../app/generated/prisma/index.js";
// import { withAccelerate } from "@prisma/extension-accelerate";

// const client = new PrismaClient({
//     log: process.env.NODE_ENV === "development" ? ["query", "info"] : [],
// }).$extends(withAccelerate());

// if (!globalThis.prisma) {
//     globalThis.prisma = client;
// }

// /** @type {typeof client} */
// const prisma = globalThis.prisma;

// export default prisma;
// import { withAccelerate } from "@prisma/extension-accelerate";
import { PrismaClient } from "../app/generated/prisma/index.js"; // dùng output custom của bạn

// Gắn prisma vào globalThis để tránh tạo lại nhiều instance trong dev
export const globalForPrisma = globalThis;

/** @type {PrismaClient} */
export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}

// export default prisma;
