import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { isNull } from "drizzle-orm";
import { powerPanels, racks } from "@/db/schema";
import { PageHeader } from "@/components/common/page-header";
import { PowerFeedForm } from "@/components/power/power-feed-form";

export default async function NewPowerFeedPage() {
    const session = await auth();
    if (!session) redirect("/login");

    const panels = await db.query.powerPanels.findMany({ where: isNull(powerPanels.deletedAt) });
    const rackList = await db.query.racks.findMany({ where: isNull(racks.deletedAt) });

    return (
        <div className="container py-8 space-y-6">
            <PageHeader
                title="Create Power Feed"
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Power", href: "/power" },
                    { label: "Feeds", href: "/power/feeds" },
                    { label: "New" },
                ]}
            />
            <PowerFeedForm panels={panels} racks={rackList} />
        </div>
    );
}
