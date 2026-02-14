import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { isNull } from "drizzle-orm";
import { sites } from "@/db/schema";
import { PageHeader } from "@/components/common/page-header";
import { PowerPanelForm } from "@/components/power/power-panel-form";

export default async function NewPowerPanelPage() {
    const session = await auth();
    if (!session) redirect("/login");

    const siteList = await db.query.sites.findMany({ where: isNull(sites.deletedAt) });

    return (
        <div className="container py-8 space-y-6">
            <PageHeader
                title="Create Power Panel"
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Power", href: "/power" },
                    { label: "Panels", href: "/power/panels" },
                    { label: "New" },
                ]}
            />
            <PowerPanelForm sites={siteList} />
        </div>
    );
}
