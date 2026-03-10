import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { manufacturers } from "@/db/schema";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pencil, Package } from "lucide-react";

interface ManufacturerDetailPageProps {
    params: Promise<{ id: string }>;
}

export default async function ManufacturerDetailPage({ params }: ManufacturerDetailPageProps) {
    const session = await auth();
    if (!session) redirect("/login");

    const { id } = await params;

    const manufacturer = await db.query.manufacturers.findFirst({
        where: eq(manufacturers.id, id),
        with: { deviceTypes: true },
    });

    if (!manufacturer || manufacturer.deletedAt) {
        notFound();
    }

    return (
        <div className="container py-8 space-y-6">
            <PageHeader
                title={manufacturer.name}
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Manufacturers", href: "/manufacturers" },
                    { label: manufacturer.name },
                ]}
                action={
                    <Button asChild>
                        <Link href={`/manufacturers/${id}/edit`}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                        </Link>
                    </Button>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Name</p>
                            <p className="mt-1">{manufacturer.name}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Slug</p>
                            <p className="mt-1 font-mono text-sm">{manufacturer.slug}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Description</p>
                            <p className="mt-1 text-muted-foreground">
                                {manufacturer.description ?? "—"}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Device Types
                            <Badge variant="secondary">{manufacturer.deviceTypes.length}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {manufacturer.deviceTypes.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No device types associated with this manufacturer.
                            </p>
                        ) : (
                            <ul className="space-y-2">
                                {manufacturer.deviceTypes.map((dt) => (
                                    <li key={dt.id} className="flex items-center gap-2 text-sm">
                                        <Package className="h-4 w-4 text-muted-foreground" />
                                        <span>{dt.model}</span>
                                        <span className="font-mono text-xs text-muted-foreground">
                                            {dt.slug}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
