import { PrismaAdapter } from "@auth/prisma-adapter";

export function CustomAdapter(prisma) {
    console.log("✅ CustomAdapter is being initialized!");

    const base = PrismaAdapter(prisma);

    return {
        ...base,
        createSession: async (data) => {
            console.log("🔥 createSession CALLED", data);
            const session = await base.createSession(data);
            console.log("✅ Session created:", session);
            return session;
        },
        createUser: async (data) => {
            console.log("👤 createUser CALLED", data);
            return base.createUser(data);
        },
        getUser: async (id) => {
            console.log("🔍 getUser CALLED", id);
            return base.getUser(id);
        },
        getUserByEmail: async (email) => {
            console.log("📧 getUserByEmail CALLED:", email);
            return prisma.user.findUnique({
                where: { email },
                include: {
                    accounts: true,
                    sessions: true,
                },
            });
        },
    };
}
