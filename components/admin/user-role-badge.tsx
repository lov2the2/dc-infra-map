import { Badge } from "@/components/ui/badge";

const ROLE_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    admin: { label: "Admin", variant: "destructive" },
    operator: { label: "Operator", variant: "default" },
    viewer: { label: "Viewer", variant: "secondary" },
    tenant_viewer: { label: "Tenant", variant: "outline" },
};

interface UserRoleBadgeProps {
    role: string;
}

export function UserRoleBadge({ role }: UserRoleBadgeProps) {
    const config = ROLE_CONFIG[role] ?? { label: role, variant: "outline" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
}
