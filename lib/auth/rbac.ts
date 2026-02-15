// RBAC (Role-Based Access Control) permission matrix and utilities

export type UserRole = "admin" | "operator" | "viewer" | "tenant_viewer";

export type Resource =
    | "sites"
    | "racks"
    | "devices"
    | "cables"
    | "power_config"
    | "power_readings"
    | "access_logs"
    | "reports"
    | "users"
    | "audit_logs";

export type Action = "read" | "create" | "update" | "delete";

// Permission matrix: resource -> role -> allowed actions
const PERMISSION_MATRIX: Record<Resource, Partial<Record<UserRole, Action[]>>> = {
    sites: {
        admin: ["read", "create", "update", "delete"],
        operator: ["read"],
        viewer: ["read"],
        tenant_viewer: ["read"],
    },
    racks: {
        admin: ["read", "create", "update", "delete"],
        operator: ["read", "create", "update", "delete"],
        viewer: ["read"],
        tenant_viewer: ["read"],
    },
    devices: {
        admin: ["read", "create", "update", "delete"],
        operator: ["read", "create", "update", "delete"],
        viewer: ["read"],
        tenant_viewer: ["read"],
    },
    cables: {
        admin: ["read", "create", "update", "delete"],
        operator: ["read", "create", "update", "delete"],
        viewer: ["read"],
    },
    power_config: {
        admin: ["read", "create", "update", "delete"],
        operator: ["read"],
        viewer: ["read"],
    },
    power_readings: {
        admin: ["read"],
        operator: ["read"],
        viewer: ["read"],
        tenant_viewer: ["read"],
    },
    access_logs: {
        admin: ["read", "create", "update", "delete"],
        operator: ["read", "create", "update", "delete"],
        viewer: ["read"],
    },
    reports: {
        admin: ["read", "create"],
        operator: ["read", "create"],
        viewer: ["read", "create"],
        tenant_viewer: ["read"],
    },
    users: {
        admin: ["read", "create", "update", "delete"],
    },
    audit_logs: {
        admin: ["read"],
        operator: ["read"],
    },
};

export function checkPermission(role: string, resource: Resource, action: Action): boolean {
    const rolePermissions = PERMISSION_MATRIX[resource]?.[role as UserRole];
    if (!rolePermissions) return false;
    return rolePermissions.includes(action);
}

export function isAdmin(role: string): boolean {
    return role === "admin";
}

export function canWrite(role: string, resource: Resource): boolean {
    return (
        checkPermission(role, resource, "create") ||
        checkPermission(role, resource, "update")
    );
}

export function canDelete(role: string, resource: Resource): boolean {
    return checkPermission(role, resource, "delete");
}
