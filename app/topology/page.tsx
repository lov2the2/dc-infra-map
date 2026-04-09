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
                description="장비 간 네트워크 연결 구조를 시각적으로 확인합니다."
            />
            <TopologyDiagram />
        </div>
    );
}
