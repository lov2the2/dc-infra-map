import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { manufacturers } from "@/db/schema";
import { isNull } from "drizzle-orm";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { ManufacturerTable } from "@/components/manufacturers/manufacturer-table";
import { Plus } from "lucide-react";

export default async function ManufacturersPage() {
    const session = await auth();
    if (!session) {
        redirect("/login");
    }

    const allManufacturers = await db.query.manufacturers.findMany({
        where: isNull(manufacturers.deletedAt),
        orderBy: (m, { asc }) => [asc(m.name)],
        with: { deviceTypes: true },
    });

    return (
        <div className="container py-8 space-y-6">
            <PageHeader
                title="Manufacturers"
                description="Manage device manufacturers"
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Manufacturers" },
                ]}
                action={
                    <Button asChild>
                        <Link href="/manufacturers/new">
                            <Plus className="h-4 w-4 mr-2" />
                            New Manufacturer
                        </Link>
                    </Button>
                }
            />
            <ManufacturerTable manufacturers={allManufacturers} />
        </div>
    );
}
