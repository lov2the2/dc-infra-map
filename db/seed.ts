import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import bcrypt from "bcryptjs";
import * as schema from "./schema";

async function seed() {
    const client = postgres(process.env.DATABASE_URL!);
    const db = drizzle(client, { schema });

    console.log("Seeding database...");

    // Admin user
    const adminEmail = process.env.ADMIN_EMAIL || "admin@dcim.local";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin1234";
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const [admin] = await db
        .insert(schema.users)
        .values({
            name: "Admin",
            email: adminEmail,
            hashedPassword,
            role: "admin",
        })
        .onConflictDoNothing()
        .returning();

    if (admin) console.log(`  Created admin: ${admin.email}`);

    // Manufacturers
    await db
        .insert(schema.manufacturers)
        .values([
            { name: "Dell Technologies", slug: "dell" },
            { name: "Cisco Systems", slug: "cisco" },
            { name: "HPE", slug: "hpe" },
            { name: "Juniper Networks", slug: "juniper" },
        ])
        .onConflictDoNothing()
        .returning();
    console.log("  Created manufacturers");

    // Tenant
    const [tenantInserted] = await db
        .insert(schema.tenants)
        .values({ name: "DCIM Operations", slug: "dcim-ops" })
        .onConflictDoNothing()
        .returning();
    const tenant =
        tenantInserted ??
        (await db.query.tenants.findFirst({ where: (t, { eq }) => eq(t.slug, "dcim-ops") }));
    console.log("  Created tenant");

    // Region
    const [regionInserted] = await db
        .insert(schema.regions)
        .values({ name: "Seoul Metropolitan", slug: "seoul-metro" })
        .onConflictDoNothing()
        .returning();
    const region =
        regionInserted ??
        (await db.query.regions.findFirst({ where: (r, { eq }) => eq(r.slug, "seoul-metro") }));
    console.log("  Created region");

    // Sites
    const sitesInserted = await db
        .insert(schema.sites)
        .values([
            {
                name: "Gasan IDC",
                slug: "gasan-idc",
                status: "active",
                regionId: region?.id,
                tenantId: tenant?.id,
                facility: "Gasan Digital Complex",
                address: "Seoul, Geumcheon-gu, Gasan-dong",
                latitude: 37.4779,
                longitude: 126.8878,
            },
            {
                name: "Pangyo IDC",
                slug: "pangyo-idc",
                status: "planned",
                regionId: region?.id,
                tenantId: tenant?.id,
                facility: "Pangyo Techno Valley",
                address: "Seongnam, Bundang-gu, Pangyo-dong",
                latitude: 37.3945,
                longitude: 127.1112,
            },
        ])
        .onConflictDoNothing()
        .returning();
    const gasanSite =
        sitesInserted.find((s) => s.slug === "gasan-idc") ??
        (await db.query.sites.findFirst({ where: (s, { eq }) => eq(s.slug, "gasan-idc") }));
    console.log("  Created sites");

    // Location (server room)
    const [serverRoomInserted] = await db
        .insert(schema.locations)
        .values({
            name: "Server Room A",
            slug: "server-room-a",
            siteId: gasanSite?.id ?? "",
            tenantId: tenant?.id,
        })
        .onConflictDoNothing()
        .returning();
    const serverRoom =
        serverRoomInserted ??
        (await db.query.locations.findFirst({ where: (l, { eq }) => eq(l.slug, "server-room-a") }));
    console.log("  Created location");

    // Racks (10 racks)
    const rackValues = Array.from({ length: 10 }, (_, i) => ({
        name: `Rack-A${String(i + 1).padStart(2, "0")}`,
        locationId: serverRoom?.id ?? "",
        tenantId: tenant?.id,
        type: i < 7 ? ("server" as const) : ("network" as const),
        uHeight: 42,
    }));

    const racksInserted = await db
        .insert(schema.racks)
        .values(rackValues)
        .onConflictDoNothing()
        .returning();
    // If racks already exist (idempotent re-run), fetch them from DB
    const createdRacks =
        racksInserted.length > 0
            ? racksInserted
            : await db.query.racks.findMany({
                  where: (r, { eq }) => eq(r.locationId, serverRoom?.id ?? ""),
              });
    console.log(`  Created/found ${createdRacks.length} racks`);

    // Device Types
    const manufacturerRows = await db.query.manufacturers.findMany();
    const dellMfr = manufacturerRows.find((m) => m.slug === "dell");
    const ciscoMfr = manufacturerRows.find((m) => m.slug === "cisco");

    const deviceTypeValues = [
        {
            manufacturerId: dellMfr?.id ?? "",
            model: "PowerEdge R750",
            slug: "dell-r750",
            uHeight: 2,
            fullDepth: 1,
            powerDraw: 800,
        },
        {
            manufacturerId: dellMfr?.id ?? "",
            model: "PowerEdge R650",
            slug: "dell-r650",
            uHeight: 1,
            fullDepth: 1,
            powerDraw: 600,
        },
        {
            manufacturerId: ciscoMfr?.id ?? "",
            model: "Catalyst 9300",
            slug: "cisco-c9300",
            uHeight: 1,
            fullDepth: 1,
            powerDraw: 350,
        },
    ];

    const typesInserted = await db
        .insert(schema.deviceTypes)
        .values(deviceTypeValues)
        .onConflictDoNothing()
        .returning();
    // Fetch all relevant device types (handles idempotent re-runs)
    const allDeviceTypes = await db.query.deviceTypes.findMany();
    const createdTypes = allDeviceTypes;
    console.log(`  Created/found device types`);

    // Devices
    const r750Type = createdTypes.find((t) => t.slug === "dell-r750");
    const r650Type = createdTypes.find((t) => t.slug === "dell-r650");
    const c9300Type = createdTypes.find((t) => t.slug === "cisco-c9300");
    void typesInserted; // used above via allDeviceTypes

    const deviceValues = createdRacks.flatMap((rack, rackIdx) => {
        if (rackIdx >= 7) {
            // Network racks: switches
            return [
                {
                    name: `${rack.name}-SW01`,
                    deviceTypeId: c9300Type?.id ?? "",
                    rackId: rack.id,
                    tenantId: tenant?.id,
                    status: "active" as const,
                    face: "front" as const,
                    position: 1,
                },
            ];
        }
        // Server racks: 2 servers each
        return [
            {
                name: `${rack.name}-SRV01`,
                deviceTypeId: r750Type?.id ?? "",
                rackId: rack.id,
                tenantId: tenant?.id,
                status: "active" as const,
                face: "front" as const,
                position: 1,
            },
            {
                name: `${rack.name}-SRV02`,
                deviceTypeId: r650Type?.id ?? "",
                rackId: rack.id,
                tenantId: tenant?.id,
                status: "active" as const,
                face: "front" as const,
                position: 3,
            },
        ];
    });

    const devicesInserted = await db
        .insert(schema.devices)
        .values(deviceValues)
        .onConflictDoNothing()
        .returning();
    // Fetch all devices in these racks for idempotent re-runs
    const allRackIds = createdRacks.map((r) => r.id);
    const createdDevices =
        devicesInserted.length > 0
            ? devicesInserted
            : await db.query.devices.findMany({
                  where: (d, { inArray }) => inArray(d.rackId, allRackIds),
              });
    console.log(`  Created/found ${createdDevices.length} devices`);

    // Patch Panel device type
    const genericMfr = manufacturerRows[0]; // Use first manufacturer
    const [patchPanelTypeInserted] = await db
        .insert(schema.deviceTypes)
        .values({
            manufacturerId: genericMfr?.id ?? "",
            model: "Generic Patch Panel 24-port",
            slug: "patch-panel-24",
            uHeight: 1,
            fullDepth: 0,
            powerDraw: 0,
        })
        .onConflictDoNothing()
        .returning();
    const patchPanelType =
        patchPanelTypeInserted ??
        (await db.query.deviceTypes.findFirst({ where: (t, { eq }) => eq(t.slug, "patch-panel-24") }));
    console.log("  Created patch panel device type");

    // Patch panel devices in network racks
    const networkRacks = createdRacks.filter((_, i) => i >= 7);
    const patchPanelValues = networkRacks.map((rack, _i) => ({
        name: `${rack.name}-PP01`,
        deviceTypeId: patchPanelType?.id ?? "",
        rackId: rack.id,
        tenantId: tenant?.id,
        status: "active" as const,
        face: "front" as const,
        position: 3,
    }));

    const patchPanelsInserted = await db
        .insert(schema.devices)
        .values(patchPanelValues)
        .onConflictDoNothing()
        .returning();
    const networkRackIds = networkRacks.map((r) => r.id);
    const createdPatchPanels =
        patchPanelsInserted.length > 0
            ? patchPanelsInserted
            : await db.query.devices.findMany({
                  where: (d, { inArray }) => inArray(d.rackId, networkRackIds),
              });
    console.log(`  Created/found ${createdPatchPanels.length} patch panels`);

    // Interfaces: 4 per server (eth0-eth3), 48 per switch
    const serverDevices = createdDevices.filter((d) => d.name.includes("-SRV"));
    const switchDevices = createdDevices.filter((d) => d.name.includes("-SW"));

    const serverInterfaceValues = serverDevices.flatMap((dev) =>
        Array.from({ length: 4 }, (_, i) => ({
            deviceId: dev.id,
            name: `eth${i}`,
            interfaceType: "rj45-1g" as const,
            speed: 1000,
            enabled: true,
        })),
    );

    const switchInterfaceValues = switchDevices.flatMap((dev) =>
        Array.from({ length: 48 }, (_, i) => ({
            deviceId: dev.id,
            name: `GigabitEthernet0/${i + 1}`,
            interfaceType: "rj45-1g" as const,
            speed: 1000,
            enabled: true,
        })),
    );

    const createdInterfaces = await db
        .insert(schema.interfaces)
        .values([...serverInterfaceValues, ...switchInterfaceValues])
        .onConflictDoNothing()
        .returning();
    console.log(`  Created ${createdInterfaces.length} interfaces`);

    // Front/rear ports for patch panels (24 each)
    for (const pp of createdPatchPanels) {
        const rearPortValues = Array.from({ length: 24 }, (_, i) => ({
            deviceId: pp.id,
            name: `Rear-${i + 1}`,
            portType: "rear" as const,
            positions: 1,
        }));

        const createdRearPorts = await db
            .insert(schema.rearPorts)
            .values(rearPortValues)
            .onConflictDoNothing()
            .returning();

        const frontPortValues = createdRearPorts.map((rp, i) => ({
            deviceId: pp.id,
            name: `Front-${i + 1}`,
            portType: "front" as const,
            rearPortId: rp.id,
        }));

        await db
            .insert(schema.frontPorts)
            .values(frontPortValues)
            .onConflictDoNothing()
            .returning();
    }
    console.log("  Created front/rear ports for patch panels");

    // Cables: servers -> patch panels -> switches
    const cableValues: {
        cableType: "cat6";
        status: "connected";
        label: string;
        length: string;
        color: string;
        terminationAType: string;
        terminationAId: string;
        terminationBType: string;
        terminationBId: string;
        tenantId: string | undefined;
    }[] = [];

    // Get all created interfaces grouped by device
    const allInterfaces = await db.query.interfaces.findMany();
    const allFrontPorts = await db.query.frontPorts.findMany();
    const allRearPorts = await db.query.rearPorts.findMany();

    let cableIdx = 1;
    // Connect first few servers to patch panels, then patch panels to switches
    for (let i = 0; i < Math.min(5, serverDevices.length); i++) {
        const server = serverDevices[i];
        const pp = createdPatchPanels[i % createdPatchPanels.length];
        const sw = switchDevices[i % switchDevices.length];

        const serverIfaces = allInterfaces.filter((iface) => iface.deviceId === server.id);
        const ppFrontPorts = allFrontPorts.filter((fp) => fp.deviceId === pp.id);
        const ppRearPorts = allRearPorts.filter((rp) => rp.deviceId === pp.id);
        const swIfaces = allInterfaces.filter((iface) => iface.deviceId === sw.id);

        if (serverIfaces.length > 0 && ppFrontPorts.length > i && swIfaces.length > i && ppRearPorts.length > i) {
            // Server eth0 -> patch panel front port
            cableValues.push({
                cableType: "cat6",
                status: "connected",
                label: `CAB-${String(cableIdx++).padStart(3, "0")}`,
                length: "3",
                color: "blue",
                terminationAType: "interface",
                terminationAId: serverIfaces[0].id,
                terminationBType: "frontPort",
                terminationBId: ppFrontPorts[i].id,
                tenantId: tenant?.id,
            });

            // Patch panel rear port -> switch interface
            cableValues.push({
                cableType: "cat6",
                status: "connected",
                label: `CAB-${String(cableIdx++).padStart(3, "0")}`,
                length: "1",
                color: "yellow",
                terminationAType: "rearPort",
                terminationAId: ppRearPorts[i].id,
                terminationBType: "interface",
                terminationBId: swIfaces[i].id,
                tenantId: tenant?.id,
            });
        }
    }

    if (cableValues.length > 0) {
        const createdCables = await db
            .insert(schema.cables)
            .values(cableValues)
            .onConflictDoNothing()
            .returning();
        console.log(`  Created ${createdCables.length} cables`);
    }

    // ── Additional Tenants ────────────────────────────────────────────
    await db
        .insert(schema.tenants)
        .values([
            { name: "Cloud Provider A", slug: "cloud-provider-a" },
            { name: "Finance Dept", slug: "finance-dept" },
        ])
        .onConflictDoNothing();
    console.log("  Created additional tenants");

    // ── Additional Region & Site ──────────────────────────────────────
    const [gyeonggiRegion] = await db
        .insert(schema.regions)
        .values({ name: "Gyeonggi Province", slug: "gyeonggi" })
        .onConflictDoNothing()
        .returning();
    console.log("  Created Gyeonggi region");

    // Look up region in case it already existed (onConflictDoNothing returns nothing)
    const gyeonggiRegionRow =
        gyeonggiRegion ??
        (await db.query.regions.findFirst({ where: (r, { eq }) => eq(r.slug, "gyeonggi") }));

    await db
        .insert(schema.sites)
        .values({
            name: "Pangyo Tech IDC",
            slug: "pangyo-tech-idc",
            status: "active",
            regionId: gyeonggiRegionRow?.id,
            tenantId: tenant?.id,
            facility: "Pangyo Techno Valley 2",
            address: "Seongnam, Bundang-gu, Baekhyeon-dong",
            latitude: 37.3945,
            longitude: 127.1112,
        })
        .onConflictDoNothing();
    console.log("  Created Pangyo Tech IDC site");

    // ── Power Section ─────────────────────────────────────────────────
    // Resolve gasanSite (may already exist from a previous seed run)
    const gasanSiteRow =
        gasanSite ??
        (await db.query.sites.findFirst({ where: (s, { eq }) => eq(s.slug, "gasan-idc") }));

    const [ppA01, ppA02] = await db
        .insert(schema.powerPanels)
        .values([
            {
                siteId: gasanSiteRow?.id ?? "",
                name: "PP-A01",
                slug: "pp-a01",
                location: "Server Room A",
                ratedCapacityKw: 30,
                voltageV: 220,
                phaseType: "single",
            },
            {
                siteId: gasanSiteRow?.id ?? "",
                name: "PP-A02",
                slug: "pp-a02",
                location: "Server Room A",
                ratedCapacityKw: 20,
                voltageV: 220,
                phaseType: "single",
            },
        ])
        .onConflictDoNothing()
        .returning();
    console.log("  Created power panels");

    // Resolve panels if they already existed
    const panelA01 =
        ppA01 ??
        (await db.query.powerPanels.findFirst({ where: (p, { eq }) => eq(p.slug, "pp-a01") }));
    const panelA02 =
        ppA02 ??
        (await db.query.powerPanels.findFirst({ where: (p, { eq }) => eq(p.slug, "pp-a02") }));

    // Use first rack for power feeds
    const firstRack = createdRacks[0] ?? (await db.query.racks.findFirst());

    const feedInsertResult = await db
        .insert(schema.powerFeeds)
        .values([
            {
                panelId: panelA01?.id ?? "",
                rackId: firstRack?.id,
                name: "Feed-A01",
                feedType: "primary",
                maxAmps: 15,
                ratedKw: 3.3,
            },
            {
                panelId: panelA01?.id ?? "",
                rackId: firstRack?.id,
                name: "Feed-A02",
                feedType: "redundant",
                maxAmps: 15,
                ratedKw: 3.3,
            },
            {
                panelId: panelA02?.id ?? "",
                rackId: firstRack?.id,
                name: "Feed-A03",
                feedType: "primary",
                maxAmps: 15,
                ratedKw: 3.3,
            },
            {
                panelId: panelA02?.id ?? "",
                rackId: firstRack?.id,
                name: "Feed-A04",
                feedType: "redundant",
                maxAmps: 15,
                ratedKw: 3.3,
            },
        ])
        .onConflictDoNothing()
        .returning();
    console.log(`  Created ${feedInsertResult.length} power feeds`);

    // Resolve at least one feed for readings
    const feedForReadings =
        feedInsertResult[0] ??
        (await db.query.powerFeeds.findFirst());

    if (feedForReadings) {
        const now = new Date();
        const readingValues = Array.from({ length: 10 }, (_, i) => {
            const recordedAt = new Date(now.getTime() - i * 5 * 60 * 1000);
            // Amperage varies between 8 and 12 in a deterministic pattern
            const amperage = 8 + (i % 5);
            const voltageV = 220 + (i % 3) - 1; // 219-221
            const powerKw = (voltageV * amperage) / 1000;
            return {
                feedId: feedForReadings.id,
                voltageV,
                currentA: amperage,
                powerKw,
                powerFactor: 0.95,
                energyKwh: powerKw * (5 / 60),
                recordedAt,
            };
        });

        await db
            .insert(schema.powerReadings)
            .values(readingValues)
            .onConflictDoNothing();
        console.log("  Created 10 power readings");
    }

    // ── Access Section ────────────────────────────────────────────────
    const adminUser =
        admin ??
        (await db.query.users.findFirst({ where: (u, { eq }) => eq(u.email, adminEmail) }));

    const now = new Date();
    await db
        .insert(schema.accessLogs)
        .values([
            {
                siteId: gasanSiteRow?.id ?? "",
                personnelName: "Kim Minsu",
                company: "IDC Engineering",
                contactPhone: "010-1234-5678",
                accessType: "maintenance",
                status: "checked_in",
                purpose: "Scheduled server maintenance",
                badgeNumber: "B-001",
                checkInAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
                expectedCheckOutAt: new Date(now.getTime() + 2 * 60 * 60 * 1000),
                createdBy: adminUser?.id,
            },
            {
                siteId: gasanSiteRow?.id ?? "",
                personnelName: "Lee Jisu",
                company: "Vendor Corp",
                contactPhone: "010-9876-5432",
                accessType: "delivery",
                status: "checked_out",
                purpose: "Hardware delivery",
                badgeNumber: "B-002",
                checkInAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
                expectedCheckOutAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
                actualCheckOutAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
                checkOutNote: "All equipment delivered successfully",
                createdBy: adminUser?.id,
            },
            {
                siteId: gasanSiteRow?.id ?? "",
                personnelName: "Park Sejin",
                company: "DCIM Operations",
                contactPhone: "010-5555-6666",
                accessType: "visit",
                status: "checked_in",
                purpose: "Executive inspection tour",
                badgeNumber: "B-003",
                checkInAt: new Date(now.getTime() - 30 * 60 * 1000),
                expectedCheckOutAt: new Date(now.getTime() + 60 * 60 * 1000),
                createdBy: adminUser?.id,
            },
        ])
        .onConflictDoNothing();
    console.log("  Created 3 access logs");

    const firstDevice = createdDevices[0] ?? (await db.query.devices.findFirst());

    await db
        .insert(schema.equipmentMovements)
        .values([
            {
                siteId: gasanSiteRow?.id ?? "",
                rackId: firstRack?.id,
                deviceId: firstDevice?.id,
                movementType: "install",
                status: "approved",
                description: "New server delivery and rack installation",
                requestedBy: adminUser?.id ?? "",
                approvedBy: adminUser?.id,
                approvedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
                serialNumber: "SN-2024-001",
                assetTag: "AT-001",
                notes: "Dell PowerEdge R750 server",
            },
            {
                siteId: gasanSiteRow?.id ?? "",
                rackId: firstRack?.id,
                movementType: "remove",
                status: "pending",
                description: "Decommissioned switch removal",
                requestedBy: adminUser?.id ?? "",
                serialNumber: "SN-2020-045",
                assetTag: "AT-045",
                notes: "EOL equipment pending RMA processing",
            },
        ])
        .onConflictDoNothing();
    console.log("  Created 2 equipment movements");

    // ── Alerts Section ────────────────────────────────────────────────
    const [inAppChannel] = await db
        .insert(schema.notificationChannels)
        .values({
            name: "In-App Alerts",
            channelType: "in_app",
            config: { url: "internal" },
            enabled: true,
        })
        .onConflictDoNothing()
        .returning();
    console.log("  Created notification channel");

    const channelRow =
        inAppChannel ??
        (await db.query.notificationChannels.findFirst({
            where: (c, { eq }) => eq(c.name, "In-App Alerts"),
        }));

    const [ruleHighPower, _ruleRackFull, ruleWarranty] = await db
        .insert(schema.alertRules)
        .values([
            {
                name: "High Power Usage",
                ruleType: "power_threshold",
                resource: "power_feeds",
                conditionField: "utilization_pct",
                conditionOperator: "gt",
                thresholdValue: "90",
                severity: "warning",
                enabled: true,
                notificationChannels: channelRow ? [channelRow.id] : [],
                cooldownMinutes: 60,
                createdBy: adminUser?.id,
            },
            {
                name: "Rack Near Full",
                ruleType: "rack_capacity",
                resource: "racks",
                conditionField: "fill_pct",
                conditionOperator: "gt",
                thresholdValue: "85",
                severity: "warning",
                enabled: true,
                notificationChannels: channelRow ? [channelRow.id] : [],
                cooldownMinutes: 60,
                createdBy: adminUser?.id,
            },
            {
                name: "Warranty Expiring Soon",
                ruleType: "warranty_expiry",
                resource: "devices",
                conditionField: "days_until_expiry",
                conditionOperator: "lt",
                thresholdValue: "30",
                severity: "info",
                enabled: true,
                notificationChannels: channelRow ? [channelRow.id] : [],
                cooldownMinutes: 1440,
                createdBy: adminUser?.id,
            },
        ])
        .onConflictDoNothing()
        .returning();
    console.log("  Created 3 alert rules");

    // Resolve rules if they already existed
    const powerRule =
        ruleHighPower ??
        (await db.query.alertRules.findFirst({
            where: (r, { eq }) => eq(r.name, "High Power Usage"),
        }));
    const warrantyRule =
        ruleWarranty ??
        (await db.query.alertRules.findFirst({
            where: (r, { eq }) => eq(r.name, "Warranty Expiring Soon"),
        }));

    const alertHistoryValues = [];
    if (powerRule) {
        alertHistoryValues.push({
            ruleId: powerRule.id,
            severity: "warning" as const,
            message: "Power feed Feed-A01 utilization exceeded 90% threshold",
            resourceType: "power_feeds",
            resourceId: feedForReadings?.id ?? "unknown",
            resourceName: "Feed-A01",
            thresholdValue: "90",
            actualValue: "93.5",
        });
    }
    if (warrantyRule) {
        alertHistoryValues.push({
            ruleId: warrantyRule.id,
            severity: "info" as const,
            message: "Device Rack-A01-SRV01 warranty expires in 15 days",
            resourceType: "devices",
            resourceId: firstDevice?.id ?? "unknown",
            resourceName: firstDevice?.name ?? "Rack-A01-SRV01",
            thresholdValue: "30",
            actualValue: "15",
            resolvedAt: new Date(now.getTime() - 60 * 60 * 1000),
        });
    }

    if (alertHistoryValues.length > 0) {
        await db
            .insert(schema.alertHistory)
            .values(alertHistoryValues)
            .onConflictDoNothing();
        console.log(`  Created ${alertHistoryValues.length} alert history entries`);
    }

    // ── Reports Section ───────────────────────────────────────────────
    await db
        .insert(schema.reportSchedules)
        .values([
            {
                name: "Weekly Device Report",
                reportType: "devices",
                frequency: "weekly",
                cronExpression: "0 9 * * 1",
                recipientEmails: ["admin@dcim.local"],
                isActive: true,
                createdBy: adminUser?.id,
            },
            {
                name: "Monthly Power Report",
                reportType: "power",
                frequency: "monthly",
                cronExpression: "0 9 1 * *",
                recipientEmails: ["admin@dcim.local"],
                isActive: true,
                createdBy: adminUser?.id,
            },
        ])
        .onConflictDoNothing();
    console.log("  Created 2 report schedules");

    console.log("Seeding complete!");
    await client.end();
}

seed().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
});
