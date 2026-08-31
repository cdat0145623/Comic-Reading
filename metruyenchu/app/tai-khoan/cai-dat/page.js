import { getUserLibrarySettings } from "@/app/_lib/data-service";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import SettingsTabs from "./SettingsTabs";
import { prisma } from "@/lib/prisma";

async function Page() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login?callbackUrl=/tai-khoan/cai-dat");
    }

    const [settings, account, pendingEmailChange] = await Promise.all([
        getUserLibrarySettings(session.user.id),
        prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                email: true,
                emailVerified: true,
                password: true,
                accounts: {
                    where: { provider: "google" },
                    select: { id: true },
                    take: 1,
                },
            },
        }),
        prisma.userAuthToken.findFirst({
            where: {
                userId: session.user.id,
                type: "EMAIL_CHANGE",
                usedAt: null,
                expiresAt: { gt: new Date() },
                targetEmail: { not: null },
            },
            orderBy: { createdAt: "desc" },
            select: { targetEmail: true, expiresAt: true },
        }),
    ]);

    return (
        <SettingsTabs
            initialSettings={settings}
            userId={session.user.id}
            account={{
                email: account?.email || session.user.email,
                emailVerified: account?.emailVerified || null,
                googleLinked: Boolean(account?.accounts.length),
                hasPassword: Boolean(account?.password),
                pendingEmail: pendingEmailChange?.targetEmail || null,
                pendingEmailExpiresAt:
                    pendingEmailChange?.expiresAt?.toISOString() || null,
            }}
        />
    );
}

export default Page;
