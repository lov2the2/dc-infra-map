// OpenAPI 3.1 types (inline to avoid external dependency)
type PathItemObject = Record<string, unknown>;
type ParameterObject = {
    name: string;
    in: string;
    required?: boolean;
    schema: Record<string, unknown>;
    description?: string;
};

// Reusable response helpers
function successResponse(schemaRef: string, description = "Successful response") {
    return {
        description,
        content: {
            "application/json": {
                schema: {
                    type: "object" as const,
                    properties: {
                        data: { $ref: `#/components/schemas/${schemaRef}` },
                    },
                },
            },
        },
    };
}

function listResponse(schemaRef: string, description = "Successful response") {
    return {
        description,
        content: {
            "application/json": {
                schema: {
                    type: "object" as const,
                    properties: {
                        data: {
                            type: "array" as const,
                            items: { $ref: `#/components/schemas/${schemaRef}` },
                        },
                    },
                },
            },
        },
    };
}

const errorResponses = {
    "401": {
        description: "Unauthorized",
        content: {
            "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
        },
    },
    "403": {
        description: "Forbidden",
        content: {
            "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
        },
    },
    "404": {
        description: "Not found",
        content: {
            "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
        },
    },
    "422": {
        description: "Validation error",
        content: {
            "application/json": {
                schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
            },
        },
    },
    "500": {
        description: "Internal server error",
        content: {
            "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
        },
    },
};

const idParam: ParameterObject = {
    name: "id",
    in: "path",
    required: true,
    schema: { type: "string", format: "uuid" },
    description: "Resource UUID",
};

// Helper to generate standard CRUD paths
function crudPaths(
    basePath: string,
    tag: string,
    schemaName: string,
    createSchemaName: string,
    opts?: {
        listParams?: ParameterObject[];
        noDelete?: boolean;
    },
): Record<string, PathItemObject> {
    const paths: Record<string, PathItemObject> = {};

    paths[basePath] = {
        get: {
            tags: [tag],
            summary: `List all ${tag.toLowerCase()}`,
            parameters: opts?.listParams,
            responses: {
                "200": listResponse(schemaName),
                ...errorResponses,
            },
        },
        post: {
            tags: [tag],
            summary: `Create a ${tag.toLowerCase().replace(/s$/, "")}`,
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: `#/components/schemas/${createSchemaName}` },
                    },
                },
            },
            responses: {
                "201": successResponse(schemaName, "Created"),
                ...errorResponses,
            },
        },
    };

    const itemPath = `${basePath}/{id}`;
    const itemOps: PathItemObject = {
        get: {
            tags: [tag],
            summary: `Get a ${tag.toLowerCase().replace(/s$/, "")} by ID`,
            parameters: [idParam],
            responses: {
                "200": successResponse(schemaName),
                ...errorResponses,
            },
        },
        patch: {
            tags: [tag],
            summary: `Update a ${tag.toLowerCase().replace(/s$/, "")}`,
            parameters: [idParam],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: `#/components/schemas/${createSchemaName}` },
                    },
                },
            },
            responses: {
                "200": successResponse(schemaName),
                ...errorResponses,
            },
        },
    };

    if (!opts?.noDelete) {
        itemOps.delete = {
            tags: [tag],
            summary: `Delete a ${tag.toLowerCase().replace(/s$/, "")}`,
            parameters: [idParam],
            responses: {
                "200": {
                    description: "Deleted",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    data: {
                                        type: "object",
                                        properties: { message: { type: "string" } },
                                    },
                                },
                            },
                        },
                    },
                },
                ...errorResponses,
            },
        };
    }

    paths[itemPath] = itemOps;
    return paths;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const openApiSpec: Record<string, any> = {
    openapi: "3.1.1",
    info: {
        title: "DC Infra Map API",
        version: "0.1.0",
        description:
            "Data Center Infrastructure Map (DCIM) API for managing sites, racks, devices, cables, power, access, and alerts.",
        contact: {
            name: "DCIM Admin",
        },
    },
    servers: [
        {
            url: "{protocol}://{host}",
            variables: {
                protocol: { default: "http", enum: ["http", "https"] },
                host: { default: "localhost:3000" },
            },
        },
    ],
    tags: [
        { name: "Auth", description: "Authentication (NextAuth)" },
        { name: "Sites", description: "Site management" },
        { name: "Locations", description: "Location management" },
        { name: "Racks", description: "Rack management" },
        { name: "Devices", description: "Device management" },
        { name: "Device Types", description: "Device type management" },
        { name: "Manufacturers", description: "Manufacturer listing" },
        { name: "Tenants", description: "Tenant management" },
        { name: "Access Logs", description: "Data center access log management" },
        { name: "Equipment Movements", description: "Equipment movement tracking" },
        { name: "Power Panels", description: "Power panel management" },
        { name: "Power Feeds", description: "Power feed management" },
        { name: "Power Readings", description: "Power reading ingestion" },
        { name: "Power SSE", description: "Real-time power streaming" },
        { name: "Power Summary", description: "Power summary data" },
        { name: "Interfaces", description: "Network interface management" },
        { name: "Console Ports", description: "Console port management" },
        { name: "Front Ports", description: "Front port management" },
        { name: "Rear Ports", description: "Rear port management" },
        { name: "Cables", description: "Cable management and tracing" },
        { name: "Audit Logs", description: "Audit log listing" },
        { name: "Export", description: "Data export (Excel, XML)" },
        { name: "Import", description: "Data import (CSV)" },
        { name: "Admin Users", description: "User management (admin only)" },
        { name: "Alert Rules", description: "Alert rule management" },
        { name: "Alert History", description: "Alert history and acknowledgment" },
        { name: "Alert Channels", description: "Notification channel management" },
        { name: "Alert Evaluate", description: "Manual alert evaluation" },
    ],
    paths: {
        // ── Auth ──
        "/api/auth/signin": {
            get: {
                tags: ["Auth"],
                summary: "NextAuth sign-in page",
                description: "Redirects to the NextAuth sign-in page. Handled by NextAuth.",
                responses: { "302": { description: "Redirect to sign-in" } },
            },
        },
        "/api/auth/session": {
            get: {
                tags: ["Auth"],
                summary: "Get current session",
                responses: {
                    "200": {
                        description: "Current session info",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Session" },
                            },
                        },
                    },
                },
            },
        },

        // ── Sites ──
        ...crudPaths("/api/sites", "Sites", "Site", "SiteCreate"),

        // ── Locations ──
        ...crudPaths("/api/locations", "Locations", "Location", "LocationCreate"),

        // ── Racks ──
        ...crudPaths("/api/racks", "Racks", "Rack", "RackCreate"),

        // ── Devices ──
        ...crudPaths("/api/devices", "Devices", "Device", "DeviceCreate", {
            listParams: [
                { name: "rackId", in: "query", schema: { type: "string" } },
                { name: "tenantId", in: "query", schema: { type: "string" } },
                { name: "status", in: "query", schema: { type: "string", enum: ["active", "planned", "staged", "failed", "decommissioning", "decommissioned"] } },
                { name: "search", in: "query", schema: { type: "string" } },
            ],
        }),

        // ── Device Types ──
        ...crudPaths("/api/device-types", "Device Types", "DeviceType", "DeviceTypeCreate"),

        // ── Manufacturers ──
        "/api/manufacturers": {
            get: {
                tags: ["Manufacturers"],
                summary: "List all manufacturers",
                responses: {
                    "200": listResponse("Manufacturer"),
                    ...errorResponses,
                },
            },
        },

        // ── Tenants ──
        ...crudPaths("/api/tenants", "Tenants", "Tenant", "TenantCreate"),

        // ── Access Logs ──
        ...crudPaths("/api/access-logs", "Access Logs", "AccessLog", "AccessLogCreate"),

        // ── Equipment Movements ──
        ...crudPaths("/api/equipment-movements", "Equipment Movements", "EquipmentMovement", "EquipmentMovementCreate"),

        // ── Power Panels ──
        ...crudPaths("/api/power/panels", "Power Panels", "PowerPanel", "PowerPanelCreate"),

        // ── Power Feeds ──
        ...crudPaths("/api/power/feeds", "Power Feeds", "PowerFeed", "PowerFeedCreate"),

        // ── Power Readings ──
        "/api/power/readings": {
            post: {
                tags: ["Power Readings"],
                summary: "Submit power readings (batch)",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "array",
                                items: { $ref: "#/components/schemas/PowerReadingInput" },
                            },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Readings accepted",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        data: {
                                            type: "object",
                                            properties: {
                                                message: { type: "string" },
                                                count: { type: "integer" },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    ...errorResponses,
                },
            },
        },

        // ── Power SSE ──
        "/api/power/sse": {
            get: {
                tags: ["Power SSE"],
                summary: "Server-Sent Events stream for real-time power data",
                description: "Opens a persistent SSE connection that pushes power reading events.",
                responses: {
                    "200": {
                        description: "SSE stream",
                        content: {
                            "text/event-stream": {
                                schema: { type: "string" },
                            },
                        },
                    },
                    ...errorResponses,
                },
            },
        },

        // ── Power Summary ──
        "/api/power/summary": {
            get: {
                tags: ["Power Summary"],
                summary: "Get power summary per rack",
                responses: {
                    "200": listResponse("RackPowerSummary"),
                    ...errorResponses,
                },
            },
        },

        // ── Interfaces ──
        ...crudPaths("/api/interfaces", "Interfaces", "Interface", "InterfaceCreate"),

        // ── Console Ports ──
        ...crudPaths("/api/console-ports", "Console Ports", "ConsolePort", "ConsolePortCreate"),

        // ── Front Ports ──
        ...crudPaths("/api/front-ports", "Front Ports", "FrontPort", "FrontPortCreate"),

        // ── Rear Ports ──
        ...crudPaths("/api/rear-ports", "Rear Ports", "RearPort", "RearPortCreate"),

        // ── Cables ──
        ...crudPaths("/api/cables", "Cables", "Cable", "CableCreate", {
            listParams: [
                { name: "cableType", in: "query", schema: { type: "string", enum: ["cat5e", "cat6", "cat6a", "fiber-om3", "fiber-om4", "fiber-sm", "dac", "power", "console"] } },
                { name: "status", in: "query", schema: { type: "string", enum: ["connected", "planned", "decommissioned"] } },
                { name: "search", in: "query", schema: { type: "string" } },
            ],
        }),

        // ── Cable Trace ──
        "/api/cables/trace/{id}": {
            get: {
                tags: ["Cables"],
                summary: "Trace cable path from a given cable",
                parameters: [idParam],
                responses: {
                    "200": listResponse("TraceStep", "Cable trace path"),
                    ...errorResponses,
                },
            },
        },

        // ── Audit Logs ──
        "/api/audit-logs": {
            get: {
                tags: ["Audit Logs"],
                summary: "List audit logs",
                parameters: [
                    { name: "userId", in: "query", schema: { type: "string" } },
                    { name: "actionType", in: "query", schema: { type: "string", enum: ["login", "api_call", "asset_view", "export"] } },
                    { name: "limit", in: "query", schema: { type: "integer", default: 50 } },
                ],
                responses: {
                    "200": listResponse("AuditLog"),
                    ...errorResponses,
                },
            },
        },

        // ── Export (Excel) ──
        ...["racks", "devices", "cables", "access", "power"].reduce(
            (acc, resource) => ({
                ...acc,
                [`/api/export/${resource}`]: {
                    get: {
                        tags: ["Export"],
                        summary: `Export ${resource} as Excel (.xlsx)`,
                        responses: {
                            "200": {
                                description: "Excel file download",
                                content: {
                                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
                                        schema: { type: "string", format: "binary" },
                                    },
                                },
                            },
                            ...errorResponses,
                        },
                    },
                },
            }),
            {} as Record<string, PathItemObject>,
        ),

        // ── Export (XML) ──
        ...["racks", "devices"].reduce(
            (acc, resource) => ({
                ...acc,
                [`/api/export/xml/${resource}`]: {
                    get: {
                        tags: ["Export"],
                        summary: `Export ${resource} as XML`,
                        responses: {
                            "200": {
                                description: "XML file download",
                                content: {
                                    "application/xml": {
                                        schema: { type: "string" },
                                    },
                                },
                            },
                            ...errorResponses,
                        },
                    },
                },
            }),
            {} as Record<string, PathItemObject>,
        ),

        // ── Import ──
        ...["devices", "cables"].reduce(
            (acc, resource) => ({
                ...acc,
                [`/api/import/${resource}`]: {
                    post: {
                        tags: ["Import"],
                        summary: `Import ${resource} from CSV`,
                        requestBody: {
                            required: true,
                            content: {
                                "multipart/form-data": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            file: { type: "string", format: "binary" },
                                        },
                                        required: ["file"],
                                    },
                                },
                            },
                        },
                        responses: {
                            "200": {
                                description: "Import result",
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object",
                                            properties: {
                                                data: {
                                                    type: "object",
                                                    properties: {
                                                        imported: { type: "integer" },
                                                        errors: { type: "array", items: { type: "object" } },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                            ...errorResponses,
                        },
                    },
                },
            }),
            {} as Record<string, PathItemObject>,
        ),

        // ── Import Templates ──
        "/api/import/templates/{type}": {
            get: {
                tags: ["Import"],
                summary: "Download CSV template for import",
                parameters: [
                    {
                        name: "type",
                        in: "path",
                        required: true,
                        schema: { type: "string", enum: ["devices", "cables"] },
                    },
                ],
                responses: {
                    "200": {
                        description: "CSV template file",
                        content: {
                            "text/csv": {
                                schema: { type: "string" },
                            },
                        },
                    },
                    ...errorResponses,
                },
            },
        },

        // ── Admin Users ──
        ...crudPaths("/api/admin/users", "Admin Users", "User", "UserCreate"),

        // ── Alert Rules ──
        ...crudPaths("/api/alerts/rules", "Alert Rules", "AlertRule", "AlertRuleCreate"),

        // ── Alert History ──
        "/api/alerts/history": {
            get: {
                tags: ["Alert History"],
                summary: "List alert history",
                parameters: [
                    { name: "severity", in: "query", schema: { type: "string", enum: ["critical", "warning", "info"] } },
                    { name: "acknowledged", in: "query", schema: { type: "string", enum: ["true", "false"] } },
                ],
                responses: {
                    "200": listResponse("AlertHistory"),
                    ...errorResponses,
                },
            },
        },

        "/api/alerts/history/{id}/acknowledge": {
            patch: {
                tags: ["Alert History"],
                summary: "Acknowledge an alert",
                parameters: [idParam],
                responses: {
                    "200": successResponse("AlertHistory"),
                    ...errorResponses,
                },
            },
        },

        // ── Alert Channels ──
        ...crudPaths("/api/alerts/channels", "Alert Channels", "NotificationChannel", "NotificationChannelCreate"),

        // ── Alert Evaluate ──
        "/api/alerts/evaluate": {
            post: {
                tags: ["Alert Evaluate"],
                summary: "Manually trigger alert evaluation",
                responses: {
                    "200": {
                        description: "Evaluation result",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        data: {
                                            type: "object",
                                            properties: {
                                                evaluated: { type: "integer" },
                                                triggered: { type: "integer" },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    ...errorResponses,
                },
            },
        },
    },
    components: {
        schemas: {
            // ── Common ──
            ErrorResponse: {
                type: "object",
                properties: {
                    error: { type: "string" },
                },
                required: ["error"],
            },
            ValidationErrorResponse: {
                type: "object",
                properties: {
                    error: { type: "string" },
                    issues: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                path: { type: "string" },
                                message: { type: "string" },
                            },
                        },
                    },
                },
            },
            Session: {
                type: "object",
                properties: {
                    user: {
                        type: "object",
                        properties: {
                            id: { type: "string" },
                            name: { type: "string", nullable: true },
                            email: { type: "string" },
                            role: { type: "string", enum: ["admin", "operator", "viewer", "tenant_viewer"] },
                        },
                    },
                    expires: { type: "string", format: "date-time" },
                },
            },

            // ── Site ──
            Site: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    name: { type: "string" },
                    slug: { type: "string" },
                    status: { type: "string", enum: ["active", "planned", "staging", "decommissioning", "retired"] },
                    regionId: { type: "string", nullable: true },
                    tenantId: { type: "string", nullable: true },
                    facility: { type: "string", nullable: true },
                    address: { type: "string", nullable: true },
                    latitude: { type: "number", nullable: true },
                    longitude: { type: "number", nullable: true },
                    description: { type: "string", nullable: true },
                    customFields: { type: "object", nullable: true },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                    deletedAt: { type: "string", format: "date-time", nullable: true },
                },
            },
            SiteCreate: {
                type: "object",
                required: ["name", "slug"],
                properties: {
                    name: { type: "string" },
                    slug: { type: "string" },
                    status: { type: "string", enum: ["active", "planned", "staging", "decommissioning", "retired"] },
                    regionId: { type: "string", nullable: true },
                    tenantId: { type: "string", nullable: true },
                    facility: { type: "string", nullable: true },
                    address: { type: "string", nullable: true },
                    latitude: { type: "number", nullable: true },
                    longitude: { type: "number", nullable: true },
                    description: { type: "string", nullable: true },
                },
            },

            // ── Location ──
            Location: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    name: { type: "string" },
                    slug: { type: "string" },
                    siteId: { type: "string" },
                    tenantId: { type: "string", nullable: true },
                    description: { type: "string", nullable: true },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                    deletedAt: { type: "string", format: "date-time", nullable: true },
                },
            },
            LocationCreate: {
                type: "object",
                required: ["name", "slug", "siteId"],
                properties: {
                    name: { type: "string" },
                    slug: { type: "string", pattern: "^[a-z0-9-]+$" },
                    siteId: { type: "string" },
                    tenantId: { type: "string", nullable: true },
                    description: { type: "string", nullable: true },
                },
            },

            // ── Rack ──
            Rack: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    name: { type: "string" },
                    locationId: { type: "string" },
                    tenantId: { type: "string", nullable: true },
                    type: { type: "string", enum: ["server", "network", "power", "mixed"] },
                    uHeight: { type: "integer" },
                    description: { type: "string", nullable: true },
                    customFields: { type: "object", nullable: true },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                    deletedAt: { type: "string", format: "date-time", nullable: true },
                },
            },
            RackCreate: {
                type: "object",
                required: ["name", "locationId"],
                properties: {
                    name: { type: "string" },
                    locationId: { type: "string" },
                    tenantId: { type: "string", nullable: true },
                    type: { type: "string", enum: ["server", "network", "power", "mixed"] },
                    uHeight: { type: "integer", minimum: 1, maximum: 60 },
                    description: { type: "string", nullable: true },
                },
            },

            // ── Device ──
            Device: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    name: { type: "string" },
                    deviceTypeId: { type: "string" },
                    rackId: { type: "string", nullable: true },
                    tenantId: { type: "string", nullable: true },
                    status: { type: "string", enum: ["active", "planned", "staged", "failed", "decommissioning", "decommissioned"] },
                    face: { type: "string", enum: ["front", "rear"] },
                    position: { type: "integer", nullable: true },
                    serialNumber: { type: "string", nullable: true },
                    assetTag: { type: "string", nullable: true },
                    primaryIp: { type: "string", nullable: true },
                    description: { type: "string", nullable: true },
                    customFields: { type: "object", nullable: true },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                    deletedAt: { type: "string", format: "date-time", nullable: true },
                },
            },
            DeviceCreate: {
                type: "object",
                required: ["name", "deviceTypeId"],
                properties: {
                    name: { type: "string" },
                    deviceTypeId: { type: "string" },
                    rackId: { type: "string", nullable: true },
                    tenantId: { type: "string", nullable: true },
                    status: { type: "string", enum: ["active", "planned", "staged", "failed", "decommissioning", "decommissioned"] },
                    face: { type: "string", enum: ["front", "rear"] },
                    position: { type: "integer", minimum: 1, nullable: true },
                    serialNumber: { type: "string", nullable: true },
                    assetTag: { type: "string", nullable: true },
                    primaryIp: { type: "string", nullable: true },
                    description: { type: "string", nullable: true },
                    reason: { type: "string", description: "Audit reason for the change" },
                },
            },

            // ── Device Type ──
            DeviceType: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    manufacturerId: { type: "string" },
                    model: { type: "string" },
                    slug: { type: "string" },
                    uHeight: { type: "integer" },
                    fullDepth: { type: "integer" },
                    weight: { type: "number", nullable: true },
                    powerDraw: { type: "integer", nullable: true },
                    interfaceTemplates: { type: "object", nullable: true },
                    description: { type: "string", nullable: true },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },
            DeviceTypeCreate: {
                type: "object",
                required: ["manufacturerId", "model", "slug"],
                properties: {
                    manufacturerId: { type: "string" },
                    model: { type: "string" },
                    slug: { type: "string" },
                    uHeight: { type: "integer", minimum: 1 },
                    fullDepth: { type: "integer" },
                    weight: { type: "number", nullable: true },
                    powerDraw: { type: "integer", nullable: true },
                    description: { type: "string", nullable: true },
                },
            },

            // ── Manufacturer ──
            Manufacturer: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    name: { type: "string" },
                    slug: { type: "string" },
                    description: { type: "string", nullable: true },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },

            // ── Tenant ──
            Tenant: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    name: { type: "string" },
                    slug: { type: "string" },
                    description: { type: "string", nullable: true },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                    deletedAt: { type: "string", format: "date-time", nullable: true },
                },
            },
            TenantCreate: {
                type: "object",
                required: ["name", "slug"],
                properties: {
                    name: { type: "string" },
                    slug: { type: "string", pattern: "^[a-z0-9-]+$" },
                    description: { type: "string", nullable: true },
                },
            },

            // ── Access Log ──
            AccessLog: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    siteId: { type: "string" },
                    personnelName: { type: "string" },
                    company: { type: "string", nullable: true },
                    contactPhone: { type: "string", nullable: true },
                    accessType: { type: "string", enum: ["visit", "maintenance", "delivery", "emergency", "tour"] },
                    status: { type: "string", enum: ["checked_in", "checked_out", "expired", "denied"] },
                    purpose: { type: "string", nullable: true },
                    escortName: { type: "string", nullable: true },
                    badgeNumber: { type: "string", nullable: true },
                    checkInAt: { type: "string", format: "date-time" },
                    checkOutAt: { type: "string", format: "date-time", nullable: true },
                    expectedCheckOutAt: { type: "string", format: "date-time", nullable: true },
                    checkOutNote: { type: "string", nullable: true },
                    createdBy: { type: "string", nullable: true },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },
            AccessLogCreate: {
                type: "object",
                required: ["siteId", "personnelName", "accessType"],
                properties: {
                    siteId: { type: "string" },
                    personnelName: { type: "string" },
                    company: { type: "string", nullable: true },
                    contactPhone: { type: "string", nullable: true },
                    accessType: { type: "string", enum: ["visit", "maintenance", "delivery", "emergency", "tour"] },
                    purpose: { type: "string", nullable: true },
                    escortName: { type: "string", nullable: true },
                    badgeNumber: { type: "string", nullable: true },
                    expectedCheckOutAt: { type: "string", nullable: true },
                },
            },

            // ── Equipment Movement ──
            EquipmentMovement: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    siteId: { type: "string" },
                    rackId: { type: "string", nullable: true },
                    deviceId: { type: "string", nullable: true },
                    movementType: { type: "string", enum: ["install", "remove", "relocate", "rma"] },
                    status: { type: "string", enum: ["pending", "approved", "in_progress", "completed", "rejected"] },
                    description: { type: "string", nullable: true },
                    serialNumber: { type: "string", nullable: true },
                    assetTag: { type: "string", nullable: true },
                    notes: { type: "string", nullable: true },
                    requestedBy: { type: "string" },
                    approvedBy: { type: "string", nullable: true },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },
            EquipmentMovementCreate: {
                type: "object",
                required: ["siteId", "movementType"],
                properties: {
                    siteId: { type: "string" },
                    rackId: { type: "string", nullable: true },
                    deviceId: { type: "string", nullable: true },
                    movementType: { type: "string", enum: ["install", "remove", "relocate", "rma"] },
                    description: { type: "string", nullable: true },
                    serialNumber: { type: "string", nullable: true },
                    assetTag: { type: "string", nullable: true },
                    notes: { type: "string", nullable: true },
                },
            },

            // ── Power Panel ──
            PowerPanel: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    name: { type: "string" },
                    slug: { type: "string" },
                    siteId: { type: "string" },
                    location: { type: "string", nullable: true },
                    ratedCapacityKw: { type: "number" },
                    voltageV: { type: "integer", nullable: true },
                    phaseType: { type: "string", enum: ["single", "three"], nullable: true },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                    deletedAt: { type: "string", format: "date-time", nullable: true },
                },
            },
            PowerPanelCreate: {
                type: "object",
                required: ["name", "slug", "siteId", "ratedCapacityKw"],
                properties: {
                    name: { type: "string" },
                    slug: { type: "string", pattern: "^[a-z0-9-]+$" },
                    siteId: { type: "string" },
                    location: { type: "string", nullable: true },
                    ratedCapacityKw: { type: "number", exclusiveMinimum: 0 },
                    voltageV: { type: "integer", exclusiveMinimum: 0 },
                    phaseType: { type: "string", enum: ["single", "three"] },
                },
            },

            // ── Power Feed ──
            PowerFeed: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    panelId: { type: "string" },
                    rackId: { type: "string", nullable: true },
                    name: { type: "string" },
                    feedType: { type: "string", enum: ["primary", "redundant"] },
                    maxAmps: { type: "number" },
                    ratedKw: { type: "number" },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                    deletedAt: { type: "string", format: "date-time", nullable: true },
                },
            },
            PowerFeedCreate: {
                type: "object",
                required: ["panelId", "name", "maxAmps", "ratedKw"],
                properties: {
                    panelId: { type: "string" },
                    rackId: { type: "string", nullable: true },
                    name: { type: "string" },
                    feedType: { type: "string", enum: ["primary", "redundant"] },
                    maxAmps: { type: "number", exclusiveMinimum: 0 },
                    ratedKw: { type: "number", exclusiveMinimum: 0 },
                },
            },

            // ── Power Reading ──
            PowerReadingInput: {
                type: "object",
                required: ["feedId", "voltageV", "currentA", "powerKw"],
                properties: {
                    feedId: { type: "string" },
                    voltageV: { type: "number" },
                    currentA: { type: "number" },
                    powerKw: { type: "number" },
                    powerFactor: { type: "number" },
                    energyKwh: { type: "number" },
                },
            },

            // ── Rack Power Summary ──
            RackPowerSummary: {
                type: "object",
                properties: {
                    rackId: { type: "string" },
                    rackName: { type: "string" },
                    feeds: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                feedId: { type: "string" },
                                name: { type: "string" },
                                feedType: { type: "string" },
                                maxKw: { type: "number" },
                                currentKw: { type: "number" },
                                utilizationPercent: { type: "number" },
                            },
                        },
                    },
                    totalMaxKw: { type: "number" },
                    totalCurrentKw: { type: "number" },
                    utilizationPercent: { type: "number" },
                },
            },

            // ── Interface ──
            Interface: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    deviceId: { type: "string" },
                    name: { type: "string" },
                    interfaceType: { type: "string", enum: ["rj45-1g", "rj45-10g", "sfp-1g", "sfp+-10g", "sfp28-25g", "qsfp+-40g", "qsfp28-100g", "console", "power"] },
                    speed: { type: "integer", nullable: true },
                    macAddress: { type: "string", nullable: true },
                    enabled: { type: "boolean" },
                    description: { type: "string", nullable: true },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },
            InterfaceCreate: {
                type: "object",
                required: ["deviceId", "name", "interfaceType"],
                properties: {
                    deviceId: { type: "string" },
                    name: { type: "string" },
                    interfaceType: { type: "string", enum: ["rj45-1g", "rj45-10g", "sfp-1g", "sfp+-10g", "sfp28-25g", "qsfp+-40g", "qsfp28-100g", "console", "power"] },
                    speed: { type: "integer", nullable: true },
                    macAddress: { type: "string", nullable: true },
                    enabled: { type: "boolean" },
                    description: { type: "string", nullable: true },
                    reason: { type: "string" },
                },
            },

            // ── Console Port ──
            ConsolePort: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    deviceId: { type: "string" },
                    name: { type: "string" },
                    portType: { type: "string", enum: ["rj45", "usb", "serial"] },
                    speed: { type: "integer", nullable: true },
                    description: { type: "string", nullable: true },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },
            ConsolePortCreate: {
                type: "object",
                required: ["deviceId", "name", "portType"],
                properties: {
                    deviceId: { type: "string" },
                    name: { type: "string" },
                    portType: { type: "string", enum: ["rj45", "usb", "serial"] },
                    speed: { type: "integer", nullable: true },
                    description: { type: "string", nullable: true },
                    reason: { type: "string" },
                },
            },

            // ── Front Port ──
            FrontPort: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    deviceId: { type: "string" },
                    name: { type: "string" },
                    portType: { type: "string", enum: ["front", "rear"] },
                    rearPortId: { type: "string" },
                    description: { type: "string", nullable: true },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },
            FrontPortCreate: {
                type: "object",
                required: ["deviceId", "name", "portType", "rearPortId"],
                properties: {
                    deviceId: { type: "string" },
                    name: { type: "string" },
                    portType: { type: "string", enum: ["front", "rear"] },
                    rearPortId: { type: "string" },
                    description: { type: "string", nullable: true },
                    reason: { type: "string" },
                },
            },

            // ── Rear Port ──
            RearPort: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    deviceId: { type: "string" },
                    name: { type: "string" },
                    portType: { type: "string", enum: ["front", "rear"] },
                    positions: { type: "integer" },
                    description: { type: "string", nullable: true },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },
            RearPortCreate: {
                type: "object",
                required: ["deviceId", "name", "portType"],
                properties: {
                    deviceId: { type: "string" },
                    name: { type: "string" },
                    portType: { type: "string", enum: ["front", "rear"] },
                    positions: { type: "integer", minimum: 1 },
                    description: { type: "string", nullable: true },
                    reason: { type: "string" },
                },
            },

            // ── Cable ──
            Cable: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    cableType: { type: "string", enum: ["cat5e", "cat6", "cat6a", "fiber-om3", "fiber-om4", "fiber-sm", "dac", "power", "console"] },
                    status: { type: "string", enum: ["connected", "planned", "decommissioned"] },
                    label: { type: "string" },
                    length: { type: "string", nullable: true },
                    color: { type: "string", nullable: true },
                    terminationAType: { type: "string", enum: ["interface", "frontPort", "rearPort", "consolePort", "powerPort", "powerOutlet"] },
                    terminationAId: { type: "string" },
                    terminationBType: { type: "string", enum: ["interface", "frontPort", "rearPort", "consolePort", "powerPort", "powerOutlet"] },
                    terminationBId: { type: "string" },
                    tenantId: { type: "string", nullable: true },
                    description: { type: "string", nullable: true },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                    deletedAt: { type: "string", format: "date-time", nullable: true },
                },
            },
            CableCreate: {
                type: "object",
                required: ["cableType", "label", "terminationAType", "terminationAId", "terminationBType", "terminationBId"],
                properties: {
                    cableType: { type: "string", enum: ["cat5e", "cat6", "cat6a", "fiber-om3", "fiber-om4", "fiber-sm", "dac", "power", "console"] },
                    status: { type: "string", enum: ["connected", "planned", "decommissioned"] },
                    label: { type: "string" },
                    length: { type: "string", nullable: true },
                    color: { type: "string", nullable: true },
                    terminationAType: { type: "string", enum: ["interface", "frontPort", "rearPort", "consolePort", "powerPort", "powerOutlet"] },
                    terminationAId: { type: "string" },
                    terminationBType: { type: "string", enum: ["interface", "frontPort", "rearPort", "consolePort", "powerPort", "powerOutlet"] },
                    terminationBId: { type: "string" },
                    tenantId: { type: "string", nullable: true },
                    description: { type: "string", nullable: true },
                    reason: { type: "string" },
                },
            },

            // ── Trace Step ──
            TraceStep: {
                type: "object",
                properties: {
                    type: { type: "string" },
                    id: { type: "string" },
                    name: { type: "string" },
                    deviceName: { type: "string" },
                    cableLabel: { type: "string", nullable: true },
                },
            },

            // ── Audit Log ──
            AuditLog: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    userId: { type: "string", nullable: true },
                    actionType: { type: "string", enum: ["login", "api_call", "asset_view", "export"] },
                    resourceType: { type: "string", nullable: true },
                    resourceId: { type: "string", nullable: true },
                    oldValue: { type: "object", nullable: true },
                    newValue: { type: "object", nullable: true },
                    reason: { type: "string", nullable: true },
                    ipAddress: { type: "string", nullable: true },
                    userAgent: { type: "string", nullable: true },
                    createdAt: { type: "string", format: "date-time" },
                },
            },

            // ── User ──
            User: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    name: { type: "string", nullable: true },
                    email: { type: "string" },
                    role: { type: "string", enum: ["admin", "operator", "viewer", "tenant_viewer"] },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },
            UserCreate: {
                type: "object",
                required: ["email", "password"],
                properties: {
                    name: { type: "string", nullable: true },
                    email: { type: "string", format: "email" },
                    password: { type: "string", minLength: 6 },
                    role: { type: "string", enum: ["admin", "operator", "viewer", "tenant_viewer"] },
                },
            },

            // ── Alert Rule ──
            AlertRule: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    name: { type: "string" },
                    ruleType: { type: "string", enum: ["power_threshold", "warranty_expiry", "rack_capacity"] },
                    resource: { type: "string" },
                    conditionField: { type: "string" },
                    conditionOperator: { type: "string", enum: ["gt", "lt", "gte", "lte", "eq"] },
                    thresholdValue: { type: "string" },
                    severity: { type: "string", enum: ["critical", "warning", "info"] },
                    enabled: { type: "boolean" },
                    notificationChannels: { type: "array", items: { type: "string" } },
                    cooldownMinutes: { type: "integer" },
                    createdBy: { type: "string", nullable: true },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },
            AlertRuleCreate: {
                type: "object",
                required: ["name", "ruleType", "thresholdValue"],
                properties: {
                    name: { type: "string" },
                    ruleType: { type: "string", enum: ["power_threshold", "warranty_expiry", "rack_capacity"] },
                    resource: { type: "string" },
                    conditionField: { type: "string" },
                    conditionOperator: { type: "string", enum: ["gt", "lt", "gte", "lte", "eq"] },
                    thresholdValue: { type: "string" },
                    severity: { type: "string", enum: ["critical", "warning", "info"] },
                    enabled: { type: "boolean" },
                    notificationChannels: { type: "array", items: { type: "string" } },
                    cooldownMinutes: { type: "integer" },
                },
            },

            // ── Alert History ──
            AlertHistory: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    ruleId: { type: "string", nullable: true },
                    severity: { type: "string", enum: ["critical", "warning", "info"] },
                    message: { type: "string" },
                    resourceType: { type: "string" },
                    resourceId: { type: "string" },
                    resourceName: { type: "string" },
                    thresholdValue: { type: "string", nullable: true },
                    actualValue: { type: "string", nullable: true },
                    acknowledgedAt: { type: "string", format: "date-time", nullable: true },
                    acknowledgedBy: { type: "string", nullable: true },
                    resolvedAt: { type: "string", format: "date-time", nullable: true },
                    createdAt: { type: "string", format: "date-time" },
                },
            },

            // ── Notification Channel ──
            NotificationChannel: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    name: { type: "string" },
                    channelType: { type: "string", enum: ["slack_webhook", "email", "in_app"] },
                    config: { type: "object" },
                    enabled: { type: "boolean" },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },
            NotificationChannelCreate: {
                type: "object",
                required: ["name", "channelType", "config"],
                properties: {
                    name: { type: "string" },
                    channelType: { type: "string", enum: ["slack_webhook", "email", "in_app"] },
                    config: { type: "object" },
                    enabled: { type: "boolean" },
                },
            },
        },
        securitySchemes: {
            session: {
                type: "apiKey",
                in: "cookie",
                name: "next-auth.session-token",
                description: "NextAuth session cookie. Sign in at /login to obtain.",
            },
        },
    },
    security: [{ session: [] }],
};
