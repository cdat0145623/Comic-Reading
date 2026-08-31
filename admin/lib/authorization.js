import { cache } from "react";
import { redirect } from "next/navigation";
import {
    hasAdminAccess,
    hasSystemAdminAccess,
} from "@mtc/auth/policy";

import { auth } from "@/lib/auth";

export const getAdminSession = cache(async () => auth());

export async function requireAdminSession() {
    const session = await getAdminSession();
    if (!hasAdminAccess(session)) redirect("/session-ended");
    return session;
}

export async function requireSystemAdmin() {
    const session = await requireAdminSession();
    if (!hasSystemAdminAccess(session)) redirect("/dashboard");
    return session;
}
