import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { locations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/common/page-header";
import { LocationForm } from "@/components/locations/location-form";

export default async function EditLocationPage({
    params,
}: {
    params: Promise<{ siteId: string; locationId: string }>;
}) {
    const session = await auth();
    if (!session) redirect("/login");

    const { siteId, locationId } = await params;

    const location = await db.query.locations.findFirst({
        where: eq(locations.id, locationId),
        with: {
            site: true,
        },
    });

    if (!location || location.deletedAt || location.siteId !== siteId) notFound();

    const site = location.site;
    if (!site) notFound();

    return (
        <div className="container py-8 space-y-6">
            <PageHeader
                title={`Edit ${location.name}`}
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Sites", href: "/sites" },
                    { label: site.name, href: `/sites/${siteId}` },
                    { label: location.name, href: `/sites/${siteId}/locations/${locationId}` },
                    { label: "Edit" },
                ]}
            />
            <LocationForm location={location} siteId={siteId} />
        </div>
    );
}
