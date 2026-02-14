import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { equipmentMovements } from "@/db/schema";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MovementStatusBadge } from "@/components/access/movement-status-badge";
import { MovementApprovalDialog } from "@/components/access/movement-approval-dialog";

export default async function EquipmentMovementDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    if (!session) redirect("/login");

    const { id } = await params;
    const movement = await db.query.equipmentMovements.findFirst({
        where: eq(equipmentMovements.id, id),
        with: {
            site: true,
            rack: true,
            device: { with: { deviceType: true } },
            requestedByUser: { columns: { id: true, name: true, email: true } },
            approvedByUser: { columns: { id: true, name: true, email: true } },
        },
    });

    if (!movement) notFound();

    const canApprove = movement.status === "pending" && session.user.role !== "viewer";

    return (
        <div className="container py-8 space-y-6">
            <PageHeader
                title="Movement Detail"
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Access", href: "/access" },
                    { label: "Equipment", href: "/access/equipment" },
                    { label: `#${id.slice(0, 8)}` },
                ]}
                action={
                    canApprove ? (
                        <div className="flex gap-2">
                            <MovementApprovalDialog movementId={id} action="approve" />
                            <MovementApprovalDialog movementId={id} action="reject" />
                        </div>
                    ) : undefined
                }
            />
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Movement Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Type</span>
                            <span className="capitalize">{movement.movementType}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Status</span>
                            <MovementStatusBadge status={movement.status} />
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Site</span>
                            <span>{movement.site?.name ?? "-"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Rack</span>
                            <span>{movement.rack?.name ?? "-"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Serial Number</span>
                            <span>{movement.serialNumber ?? "-"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Asset Tag</span>
                            <span>{movement.assetTag ?? "-"}</span>
                        </div>
                        {movement.description && (
                            <div>
                                <span className="text-muted-foreground">Description</span>
                                <p className="mt-1">{movement.description}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Workflow</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Requested By</span>
                            <span>{movement.requestedByUser?.name ?? movement.requestedByUser?.email ?? "-"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Requested At</span>
                            <span>{new Date(movement.createdAt).toLocaleString("ko-KR")}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Approved By</span>
                            <span>{movement.approvedByUser?.name ?? movement.approvedByUser?.email ?? "-"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Approved At</span>
                            <span>{movement.approvedAt ? new Date(movement.approvedAt).toLocaleString("ko-KR") : "-"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Completed At</span>
                            <span>{movement.completedAt ? new Date(movement.completedAt).toLocaleString("ko-KR") : "-"}</span>
                        </div>
                        {movement.notes && (
                            <div>
                                <span className="text-muted-foreground">Notes</span>
                                <p className="mt-1">{movement.notes}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
