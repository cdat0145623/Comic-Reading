import { AdminOverview } from "@/components/dashboard/admin-overview";
import { ContributorOverview } from "@/components/dashboard/contributor-overview";
import { requireAdminSession } from "@/lib/authorization";
import { overviewMeta, ROLES } from "@/lib/navigation";

export default async function DashboardPage() {
    const session = await requireAdminSession();
    const meta = overviewMeta[session.user.role];
    const ScopeIcon = meta.icon;

    return (
        <>
            <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs font-bold uppercase text-accent">
                        {meta.kicker}
                    </p>
                    <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
                        {meta.title}
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                        {meta.description}
                    </p>
                </div>
                <div className="inline-flex h-9 shrink-0 items-center gap-2 self-start rounded-full border border-accent-border bg-accent-soft px-3 text-xs font-semibold text-accent-soft-foreground">
                    <ScopeIcon size={15} />
                    {meta.scope}
                </div>
            </header>
            {session.user.role === ROLES.ADMIN ? (
                <AdminOverview />
            ) : (
                <ContributorOverview />
            )}
        </>
    );
}
