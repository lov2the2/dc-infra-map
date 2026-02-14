import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { isNull } from "drizzle-orm";
import { sites, racks } from "@/db/schema";
import { PageHeader } from "@/components/common/page-header";
import { EquipmentMovementForm } from "@/components/access/equipment-movement-form";

export default async function NewEquipmentMovementPage() {
    const session = await auth();
    if (!session) redirect("/login");

    const siteList = await db.query.sites.findMany({ where: isNull(sites.deletedAt) });
    const rackList = await db.query.racks.findMany({ where: isNull(racks.deletedAt) });

    return (
        <div className="container py-8 space-y-6">
            <PageHeader
                title="New Equipment Movement"
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Access", href: "/access" },
                    { label: "Equipment", href: "/access/equipment" },
                    { label: "New" },
                ]}
            />
            <EquipmentMovementForm sites={siteList} racks={rackList} />
        </div>
    );
}
