import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { racks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { RackElevationClient } from "@/components/rack/rack-elevation-client";
import type { RackWithDevices } from "@/types/entities";

export default async function RackElevationPage({
    params,
}: {
    params: Promise<{ rackId: string }>;
}) {
    const session = await auth();
    if (!session) redirect("/login");

    const { rackId } = await params;

    const rack = await db.query.racks.findFirst({
        where: eq(racks.id, rackId),
        with: {
            location: { with: { site: true } },
            tenant: true,
            devices: {
                with: { deviceType: true },
            },
        },
    });

    if (!rack) notFound();

    // Filter out deleted devices
    const filteredRack = {
        ...rack,
        devices: rack.devices.filter((d) => !d.deletedAt),
    } as RackWithDevices;

    const siteName = rack.location?.site?.name;
    const siteId = rack.location?.site?.id;

    return (
        <div className="container py-8">
            <RackElevationClient
                initialRack={filteredRack}
                siteName={siteName}
                locationName={rack.location?.name}
                siteId={siteId}
            />
        </div>
    );
}
