import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { sites } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/common/page-header";
import { LocationForm } from "@/components/locations/location-form";

export default async function NewLocationPage({
    params,
}: {
    params: Promise<{ siteId: string }>;
}) {
    const session = await auth();
    if (!session) redirect("/login");

    const { siteId } = await params;

    const site = await db.query.sites.findFirst({
        where: eq(sites.id, siteId),
    });

    if (!site || site.deletedAt) notFound();

    return (
        <div className="container py-8 space-y-6">
            <PageHeader
                title="Add Location"
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Sites", href: "/sites" },
                    { label: site.name, href: `/sites/${siteId}` },
                    { label: "Add Location" },
                ]}
            />
            <LocationForm siteId={siteId} />
        </div>
    );
}
