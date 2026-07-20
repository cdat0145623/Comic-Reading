import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireVerifiedUser() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("UNAUTHENTICATED");

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, email: true, emailVerified: true },
    });
    if (!user?.emailVerified) throw new Error("EMAIL_NOT_VERIFIED");
    return user;
}
