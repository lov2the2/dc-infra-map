import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { accessLogs } from "@/db/schema";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AccessStatusBadge } from "@/components/access/access-status-badge";
import { CheckOutDialog } from "@/components/access/check-out-dialog";

export default async function AccessLogDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    if (!session) redirect("/login");

    const { id } = await params;
    const log = await db.query.accessLogs.findFirst({
        where: eq(accessLogs.id, id),
        with: {
            createdByUser: { columns: { id: true, name: true, email: true } },
            site: true,
        },
    });

    if (!log) notFound();

    return (
        <div className="container py-8 space-y-6">
            <PageHeader
                title="Access Log Detail"
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Access", href: "/access" },
                    { label: log.personnelName },
                ]}
                action={
                    log.status === "checked_in" ? (
                        <CheckOutDialog logId={log.id} personnelName={log.personnelName} />
                    ) : undefined
                }
            />
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Personnel Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Name</span>
                            <span className="font-medium">{log.personnelName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Company</span>
                            <span>{log.company ?? "-"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Phone</span>
                            <span>{log.contactPhone ?? "-"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Type</span>
                            <span className="capitalize">{log.accessType}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Status</span>
                            <AccessStatusBadge status={log.status} />
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Badge</span>
                            <span>{log.badgeNumber ?? "-"}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Visit Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Site</span>
                            <span>{log.site?.name ?? "-"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Purpose</span>
                            <span className="text-right max-w-[200px]">{log.purpose ?? "-"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Escort</span>
                            <span>{log.escortName ?? "-"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Check In</span>
                            <span>{new Date(log.checkInAt).toLocaleString("ko-KR")}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Check Out</span>
                            <span>{log.actualCheckOutAt ? new Date(log.actualCheckOutAt).toLocaleString("ko-KR") : "-"}</span>
                        </div>
                        {log.checkOutNote && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Note</span>
                                <span className="text-right max-w-[200px]">{log.checkOutNote}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
