import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/common/page-header";
import { TenantForm } from "@/components/tenants/tenant-form";

export default async function NewTenantPage() {
    const session = await auth();
    if (!session) redirect("/login");

    return (
        <div className="container py-8 space-y-6">
            <PageHeader
                title="New Tenant"
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Tenants", href: "/tenants" },
                    { label: "New Tenant" },
                ]}
            />
            <TenantForm />
        </div>
    );
}
