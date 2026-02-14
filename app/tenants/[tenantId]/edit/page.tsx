import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/common/page-header";
import { TenantForm } from "@/components/tenants/tenant-form";

export default async function EditTenantPage({
    params,
}: {
    params: Promise<{ tenantId: string }>;
}) {
    const session = await auth();
    if (!session) redirect("/login");

    const { tenantId } = await params;

    const [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, tenantId));

    if (!tenant || tenant.deletedAt) notFound();

    return (
        <div className="container py-8 space-y-6">
            <PageHeader
                title={`Edit ${tenant.name}`}
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Tenants", href: "/tenants" },
                    { label: tenant.name, href: `/tenants/${tenantId}` },
                    { label: "Edit" },
                ]}
            />
            <TenantForm tenant={tenant} />
        </div>
    );
}
