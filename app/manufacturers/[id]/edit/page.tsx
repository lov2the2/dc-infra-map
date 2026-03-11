import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { manufacturers } from "@/db/schema";
import { PageHeader } from "@/components/common/page-header";
import { ManufacturerForm } from "@/components/manufacturers/manufacturer-form";

interface EditManufacturerPageProps {
    params: Promise<{ id: string }>;
}

export default async function EditManufacturerPage({ params }: EditManufacturerPageProps) {
    const session = await auth();
    if (!session) redirect("/login");

    const { id } = await params;

    const manufacturer = await db.query.manufacturers.findFirst({
        where: eq(manufacturers.id, id),
    });

    if (!manufacturer || manufacturer.deletedAt) {
        notFound();
    }

    return (
        <div className="container py-8 space-y-6">
            <PageHeader
                title="Edit Manufacturer"
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Manufacturers", href: "/manufacturers" },
                    { label: manufacturer.name, href: `/manufacturers/${id}` },
                    { label: "Edit" },
                ]}
            />
            <ManufacturerForm manufacturer={manufacturer} />
        </div>
    );
}
