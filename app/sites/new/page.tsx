import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/common/page-header";
import { SiteForm } from "@/components/sites/site-form";

export default async function NewSitePage() {
    const session = await auth();
    if (!session) redirect("/login");

    return (
        <div className="container py-8 space-y-6">
            <PageHeader
                title="New Site"
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Sites", href: "/sites" },
                    { label: "New Site" },
                ]}
            />
            <SiteForm />
        </div>
    );
}
