import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/common/page-header";
import { ManufacturerForm } from "@/components/manufacturers/manufacturer-form";

export default async function NewManufacturerPage() {
    const session = await auth();
    if (!session) redirect("/login");

    return (
        <div className="container py-8 space-y-6">
            <PageHeader
                title="New Manufacturer"
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Manufacturers", href: "/manufacturers" },
                    { label: "New Manufacturer" },
                ]}
            />
            <ManufacturerForm />
        </div>
    );
}
