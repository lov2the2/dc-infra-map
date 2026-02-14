import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { isNull, desc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/page-header";
import { TenantTable } from "@/components/tenants/tenant-table";
import { Plus } from "lucide-react";

export default async function TenantsPage() {
    const session = await auth();
    if (!session) redirect("/login");

    const tenantList = await db
        .select()
        .from(tenants)
        .where(isNull(tenants.deletedAt))
        .orderBy(desc(tenants.createdAt));

    return (
        <div className="container py-8 space-y-6">
            <PageHeader
                title="Tenants"
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Tenants" },
                ]}
                action={
                    <Button asChild>
                        <Link href="/tenants/new">
                            <Plus className="mr-2 h-4 w-4" />
                            New Tenant
                        </Link>
                    </Button>
                }
            />
            <TenantTable tenants={tenantList} />
        </div>
    );
}
