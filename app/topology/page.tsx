import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/common/page-header";
import { TopologyDiagram } from "@/components/topology/topology-diagram";

export default async function TopologyPage() {
    const session = await auth();
    if (!session) redirect("/login");

    return (
        <div className="container py-8 space-y-6">
            <PageHeader
                title="Network Topology"
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Topology" },
                ]}
                description="Visual overview of network connections between devices"
            />
            <TopologyDiagram />
        </div>
    );
}
