import { prisma } from "@mtc/database";
import { ADMIN_ROLES } from "@mtc/auth";

try {
    process.loadEnvFile("metruyenchu/.env");
} catch (error) {
    if (error?.code !== "ENOENT") throw error;
}

function readOption(name) {
    const prefix = `--${name}=`;
    const inline = process.argv.find((value) => value.startsWith(prefix));
    if (inline) return inline.slice(prefix.length);

    const index = process.argv.indexOf(`--${name}`);
    return index >= 0 ? process.argv[index + 1] : undefined;
}

const email = readOption("email")?.trim().toLowerCase();
const role = readOption("role")?.trim().toUpperCase();
const allowedRoles = ["USER", ...ADMIN_ROLES];

try {
    if (!email || !role || !allowedRoles.includes(role)) {
        throw new Error(
            "Dùng: npm run user:set-role -- --email user@example.com --role ADMIN|UPLOADER|USER",
        );
    }

    const currentUser = await prisma.user.findUnique({
        where: { email },
        select: {
            id: true,
            email: true,
            role: true,
            emailVerified: true,
        },
    });
    if (!currentUser) throw new Error(`Không tìm thấy user ${email}`);

    const updatedUser = await prisma.user.update({
        where: { id: currentUser.id },
        data: {
            role,
            authVersion: { increment: 1 },
        },
        select: {
            email: true,
            role: true,
            emailVerified: true,
            authVersion: true,
        },
    });

    console.log(
        JSON.stringify(
            {
                ...updatedUser,
                canLoginAdmin:
                    ADMIN_ROLES.includes(updatedUser.role) &&
                    Boolean(updatedUser.emailVerified),
            },
            null,
            2,
        ),
    );
} catch (error) {
    console.error(error.message);
    process.exitCode = 1;
} finally {
    await prisma.$disconnect();
}
