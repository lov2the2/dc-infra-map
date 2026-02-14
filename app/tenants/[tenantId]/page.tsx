import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { tenants, devices, racks } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/common/page-header";
import { TenantDeleteButton } from "@/components/tenants/tenant-delete-button";
import { Pencil } from "lucide-react";

export default async function TenantDetailPage({
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

    const [devicesCountResult, racksCountResult] = await Promise.all([
        db.select({ count: count() }).from(devices).where(eq(devices.tenantId, tenantId)),
        db.select({ count: count() }).from(racks).where(eq(racks.tenantId, tenantId)),
    ]);

    const devicesCount = devicesCountResult[0]?.count ?? 0;
    const racksCount = racksCountResult[0]?.count ?? 0;

    return (
        <div className="container py-8 space-y-6">
            <PageHeader
                title={tenant.name}
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Tenants", href: "/tenants" },
                    { label: tenant.name },
                ]}
                action={
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href={`/tenants/${tenantId}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </Button>
                        <TenantDeleteButton tenantId={tenantId} tenantName={tenant.name} />
                    </div>
                }
            />
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Name</p>
                            <p className="text-sm">{tenant.name}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Slug</p>
                            <p className="text-sm font-mono">{tenant.slug}</p>
                        </div>
                        {tenant.description && (
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Description</p>
                                <p className="text-sm">{tenant.description}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Created</p>
                            <p className="text-sm">
                                {new Date(tenant.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Resources</CardTitle>
                        <CardDescription>Associated infrastructure</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Devices</p>
                            <span className="text-2xl font-bold">{devicesCount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Racks</p>
                            <span className="text-2xl font-bold">{racksCount}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
