import { PageHeader } from "@/components/common/page-header";
import { UserTable } from "@/components/admin/user-table";

export default function AdminUsersPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="User Management"
                description="Manage user accounts and role assignments."
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
