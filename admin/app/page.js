import { redirect } from "next/navigation";
import { hasAdminAccess } from "@mtc/auth/policy";

import { getAdminSession } from "@/lib/authorization";

export default async function HomePage() {
    const session = await getAdminSession();
    redirect(hasAdminAccess(session) ? "/dashboard" : "/login");
}
