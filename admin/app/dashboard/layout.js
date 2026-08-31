import { requireAdminSession } from "@/lib/authorization";
import { DashboardFrame } from "@/components/dashboard/dashboard-frame";

export default async function DashboardLayout({ children }) {
    const session = await requireAdminSession();

    return <DashboardFrame user={session.user}>{children}</DashboardFrame>;
}
