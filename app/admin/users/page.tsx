import { PageHeader } from "@/components/common/page-header";
import { UserTable } from "@/components/admin/user-table";

export default function AdminUsersPage() {
    return (
        <div className="container py-8 space-y-6">
            <PageHeader
                title="User Management"
                description="시스템 사용자 계정과 권한을 관리합니다."
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Admin" },
                    { label: "Users" },
                ]}
            />
            <UserTable />
        </div>
    );
}
