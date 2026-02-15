import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { cables } from "@/db/schema";
import { isNull, and, eq, ilike } from "drizzle-orm";
import { PageHeader } from "@/components/common/page-header";
import { CableFilters } from "@/components/cables/cable-filters";
import { CableTable } from "@/components/cables/cable-table";
import { CableForm } from "@/components/cables/cable-form";
import type { CableWithTenant } from "@/types/cable";

export default async function CablesPage({
    searchParams,
}: {
    searchParams: Promise<{ search?: string; cableType?: string; status?: string }>;
}) {
    const session = await auth();
    if (!session) redirect("/login");

    const params = await searchParams;
    const conditions = [isNull(cables.deletedAt)];
    if (params.cableType) conditions.push(eq(cables.cableType, params.cableType as "cat5e"));
    if (params.status) conditions.push(eq(cables.status, params.status as "connected"));
    if (params.search) conditions.push(ilike(cables.label, `%${params.search}%`));

    const result = await db.query.cables.findMany({
        where: and(...conditions),
        with: { tenant: true },
    });

    return (
        <div className="container py-8 space-y-6">
            <PageHeader
                title="Cables"
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Cables" },
                ]}
                action={<CableForm />}
            />
            <CableFilters />
            <CableTable cables={result as CableWithTenant[]} />
        </div>
    );
}
