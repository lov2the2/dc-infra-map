import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { devices } from "@/db/schema";
import { isNull, and, eq, ilike } from "drizzle-orm";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/page-header";
import { DeviceFilters } from "@/components/devices/device-filters";
import { DeviceTable } from "@/components/devices/device-table";
import type { DeviceWithRelations } from "@/types/entities";

export default async function DevicesPage({
    searchParams,
}: {
    searchParams: Promise<{ search?: string; status?: string; tenantId?: string }>;
}) {
    const session = await auth();
    if (!session) redirect("/login");

    const params = await searchParams;
    const conditions = [isNull(devices.deletedAt)];
    if (params.status) conditions.push(eq(devices.status, params.status as "active"));
    if (params.tenantId) conditions.push(eq(devices.tenantId, params.tenantId));
    if (params.search) conditions.push(ilike(devices.name, `%${params.search}%`));

    const result = await db.query.devices.findMany({
        where: and(...conditions),
        with: {
            deviceType: { with: { manufacturer: true } },
            rack: true,
            tenant: true,
        },
    });

    return (
        <div className="container py-8 space-y-6">
            <PageHeader
                title="Devices"
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Devices" },
                ]}
                action={
                    <Button asChild>
                        <Link href="/devices/new">
                            <Plus className="mr-2 h-4 w-4" />
                            New Device
                        </Link>
                    </Button>
                }
            />
            <DeviceFilters />
            <DeviceTable devices={result as DeviceWithRelations[]} />
        </div>
    );
}
