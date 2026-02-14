import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { isNull } from "drizzle-orm";
import { powerFeeds } from "@/db/schema";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/page-header";
import { PowerFeedList } from "@/components/power/power-feed-list";
import { Plus } from "lucide-react";
import type { PowerFeedWithRelations } from "@/types/entities";

export default async function PowerFeedsPage() {
    const session = await auth();
    if (!session) redirect("/login");

    const feeds = await db.query.powerFeeds.findMany({
        where: isNull(powerFeeds.deletedAt),
        with: { panel: true, rack: true, powerPorts: true },
        orderBy: (t, { asc }) => [asc(t.name)],
    });

    return (
        <div className="container py-8 space-y-6">
            <PageHeader
                title="Power Feeds"
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Power", href: "/power" },
                    { label: "Feeds" },
                ]}
                action={
                    <Button asChild>
                        <Link href="/power/feeds/new">
                            <Plus className="mr-2 h-4 w-4" />
                            New Feed
                        </Link>
                    </Button>
                }
            />
            <PowerFeedList feeds={feeds as unknown as PowerFeedWithRelations[]} />
        </div>
    );
}
