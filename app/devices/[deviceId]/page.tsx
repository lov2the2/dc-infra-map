import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { devices } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { DeviceAuditLog } from "@/components/devices/device-audit-log";

export default async function DeviceDetailPage({
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
                title={device.name}
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Devices", href: "/devices" },
                    { label: device.name },
                ]}
                action={
                    <Button asChild variant="outline">
                        <Link href={`/devices/${deviceId}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </Link>
                    </Button>
                }
            />

            <Tabs defaultValue="details">
                <TabsList>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="history">Change History</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">General</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Status</span>
                                    <StatusBadge status={device.status} />
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Type</span>
                                    <span>
                                        {device.deviceType.manufacturer?.name}{" "}
                                        {device.deviceType.model}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">U Height</span>
                                    <span>{device.deviceType.uHeight}U</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Face</span>
                                    <span className="capitalize">{device.face}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Tenant</span>
                                    <span>{device.tenant?.name ?? "—"}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Location</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Rack</span>
                                    <span>
                                        {device.rack ? (
                                            <Link
                                                href={`/racks/${device.rack.id}`}
                                                className="text-primary hover:underline"
                                            >
                                                {device.rack.name}
                                            </Link>
                                        ) : (
                                            "—"
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Position</span>
                                    <span>{device.position ? `U${device.position}` : "—"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Serial Number</span>
                                    <span className="font-mono">{device.serialNumber ?? "—"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Asset Tag</span>
                                    <span className="font-mono">{device.assetTag ?? "—"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Primary IP</span>
                                    <span className="font-mono">{device.primaryIp ?? "—"}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {device.description && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Description</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">{device.description}</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="history">
                    <DeviceAuditLog deviceId={deviceId} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
