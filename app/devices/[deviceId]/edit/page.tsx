import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { devices } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/common/page-header";
import { DeviceForm } from "@/components/devices/device-form";

export default async function EditDevicePage({
    params,
}: {
    params: Promise<{ deviceId: string }>;
}) {
    const session = await auth();
    if (!session) redirect("/login");

    const { deviceId } = await params;
    const device = await db.query.devices.findFirst({
        where: eq(devices.id, deviceId),
        with: {
            deviceType: { with: { manufacturer: true } },
            rack: true,
            tenant: true,
        },
    });

    if (!device) notFound();

    return (
        <div className="container py-8 space-y-6">
            <PageHeader
                title={`Edit ${device.name}`}
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Devices", href: "/devices" },
                    { label: device.name, href: `/devices/${deviceId}` },
                    { label: "Edit" },
                ]}
            />
            <DeviceForm
                device={device}
                defaultManufacturerId={device.deviceType.manufacturer?.id}
            />
        </div>
    );
}
