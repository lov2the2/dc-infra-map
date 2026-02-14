import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { isNull } from "drizzle-orm";
import { equipmentMovements } from "@/db/schema";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/page-header";
import { EquipmentMovementList } from "@/components/access/equipment-movement-list";
import { Plus } from "lucide-react";
import type { EquipmentMovementWithRelations } from "@/types/entities";

export default async function EquipmentPage() {
    const session = await auth();
    if (!session) redirect("/login");

    const movements = await db.query.equipmentMovements.findMany({
        where: isNull(equipmentMovements.deletedAt),
        with: {
            site: true,
            rack: true,
            device: { with: { deviceType: true } },
            requestedByUser: { columns: { id: true, name: true, email: true } },
            approvedByUser: { columns: { id: true, name: true, email: true } },
        },
        orderBy: (t, { desc }) => [desc(t.createdAt)],
        limit: 50,
    });

    return (
        <div className="container py-8 space-y-6">
            <PageHeader
                title="Equipment Movements"
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Access", href: "/access" },
                    { label: "Equipment" },
                ]}
                action={
                    <Button asChild>
                        <Link href="/access/equipment/new">
                            <Plus className="mr-2 h-4 w-4" />
                            New Movement
                        </Link>
                    </Button>
                }
            />
            <EquipmentMovementList movements={movements as unknown as EquipmentMovementWithRelations[]} />
        </div>
    );
}
