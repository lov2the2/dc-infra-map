import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { racks } from "@/db/schema";
import { isNull } from "drizzle-orm";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Server } from "lucide-react";

export default async function RacksPage() {
    const session = await auth();
    if (!session) {
        redirect("/login");
    }

    const allRacks = await db.query.racks.findMany({
        where: isNull(racks.deletedAt),
        with: {
            location: {
                with: { site: true },
            },
        },
        orderBy: (r, { asc }) => [asc(r.name)],
    });

    return (
        <div className="container py-8 space-y-6">
            <PageHeader
                title="Racks"
                description="All infrastructure racks across sites and locations"
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Racks" },
                ]}
            />

            {allRacks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Server className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No racks found</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Racks are created within site locations.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {allRacks.map((rack) => (
                        <Link key={rack.id} href={`/racks/${rack.id}`}>
                            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <CardTitle className="text-base line-clamp-1">
                                            {rack.name}
                                        </CardTitle>
                                        <Badge variant="outline" className="shrink-0 text-xs capitalize">
                                            {rack.type}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-1 text-sm text-muted-foreground">
                                    <p className="line-clamp-1">{rack.location?.site?.name ?? "—"}</p>
                                    <p className="line-clamp-1">{rack.location?.name ?? "—"}</p>
                                    <p className="text-xs">{rack.uHeight}U</p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
