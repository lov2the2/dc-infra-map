import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { isNull } from "drizzle-orm";
import { accessLogs, sites } from "@/db/schema";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/page-header";
import { AccessLogList } from "@/components/access/access-log-list";
import { AccessLogFilters } from "@/components/access/access-log-filters";
import { Plus } from "lucide-react";
import type { AccessLogWithUser } from "@/types/entities";

export default async function AccessPage() {
    const session = await auth();
    if (!session) redirect("/login");

    const logs = await db.query.accessLogs.findMany({
        where: isNull(accessLogs.deletedAt),
        with: {
            createdByUser: { columns: { id: true, name: true, email: true } },
            site: true,
        },
        orderBy: (t, { desc }) => [desc(t.checkInAt)],
        limit: 50,
    });

    const siteList = await db.query.sites.findMany({
        where: isNull(sites.deletedAt),
    });

    return (
        <div className="container py-8 space-y-6">
            <PageHeader
                title="Access Management"
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Access" },
                ]}
                action={
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/access/equipment">Equipment</Link>
                        </Button>
                        <Button asChild>
                            <Link href="/access/check-in">
                                <Plus className="mr-2 h-4 w-4" />
                                Check In
                            </Link>
                        </Button>
                    </div>
                }
            />
            <AccessLogFilters sites={siteList} />
            <AccessLogList logs={logs as unknown as AccessLogWithUser[]} />
        </div>
    );
}
