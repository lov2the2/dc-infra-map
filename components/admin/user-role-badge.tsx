import { Badge } from "@/components/ui/badge";

const ROLE_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    admin: { label: "Admin", variant: "destructive" },
    operator: { label: "Operator", variant: "default" },
    viewer: { label: "Viewer", variant: "secondary" },
    tenant_viewer: { label: "Tenant", variant: "outline" },
};

interface UserRoleBadgeProps {
    role: string;
    className?: string;
}

export function UserRoleBadge({ role, className }: UserRoleBadgeProps) {
    const config = ROLE_CONFIG[role] ?? { label: role, variant: "outline" as const };
    return <Badge variant={config.variant} className={className}>{config.label}</Badge>;
}
