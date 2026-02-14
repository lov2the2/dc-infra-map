import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { isNull } from "drizzle-orm";
import { powerPanels } from "@/db/schema";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/page-header";
import { PowerPanelList } from "@/components/power/power-panel-list";
import { Plus } from "lucide-react";
import type { PowerPanelWithFeeds } from "@/types/entities";

export default async function PowerPanelsPage() {
    const session = await auth();
    if (!session) redirect("/login");

    const panels = await db.query.powerPanels.findMany({
        where: isNull(powerPanels.deletedAt),
        with: { powerFeeds: true, site: true },
        orderBy: (t, { asc }) => [asc(t.name)],
    });

    return (
        <div className="container py-8 space-y-6">
            <PageHeader
                title="Power Panels"
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Power", href: "/power" },
                    { label: "Panels" },
                ]}
                action={
                    <Button asChild>
                        <Link href="/power/panels/new">
                            <Plus className="mr-2 h-4 w-4" />
                            New Panel
                        </Link>
                    </Button>
                }
            />
            <PowerPanelList panels={panels as unknown as PowerPanelWithFeeds[]} />
        </div>
    );
}
