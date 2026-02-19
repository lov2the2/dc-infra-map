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
    const [tenant] = await db
        .insert(schema.tenants)
        .values({ name: "DCIM Operations", slug: "dcim-ops" })
        .onConflictDoNothing()
        .returning();
    console.log("  Created tenant");

    // Region
    const [region] = await db
        .insert(schema.regions)
        .values({ name: "Seoul Metropolitan", slug: "seoul-metro" })
        .onConflictDoNothing()
        .returning();
    console.log("  Created region");

    // Sites
    const [gasanSite, _pangyo] = await db
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
    console.log("  Created sites");

    // Location (server room)
    const [serverRoom] = await db
        .insert(schema.locations)
        .values({
            name: "Server Room A",
            slug: "server-room-a",
            siteId: gasanSite?.id ?? "",
            tenantId: tenant?.id,
        })
        .onConflictDoNothing()
        .returning();
    console.log("  Created location");

    // Racks (10 racks)
    const rackValues = Array.from({ length: 10 }, (_, i) => ({
        name: `Rack-A${String(i + 1).padStart(2, "0")}`,
        locationId: serverRoom?.id ?? "",
        tenantId: tenant?.id,
        type: i < 7 ? ("server" as const) : ("network" as const),
        uHeight: 42,
    }));

    const createdRacks = await db
        .insert(schema.racks)
        .values(rackValues)
        .onConflictDoNothing()
        .returning();
    console.log(`  Created ${createdRacks.length} racks`);

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

    const createdTypes = await db
        .insert(schema.deviceTypes)
        .values(deviceTypeValues)
        .onConflictDoNothing()
        .returning();
    console.log(`  Created ${createdTypes.length} device types`);

    // Devices
    const r750Type = createdTypes.find((t) => t.slug === "dell-r750");
    const r650Type = createdTypes.find((t) => t.slug === "dell-r650");
    const c9300Type = createdTypes.find((t) => t.slug === "cisco-c9300");

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

    const createdDevices = await db
        .insert(schema.devices)
        .values(deviceValues)
        .onConflictDoNothing()
        .returning();
    console.log(`  Created ${createdDevices.length} devices`);

    // Patch Panel device type
    const genericMfr = manufacturerRows[0]; // Use first manufacturer
    const [patchPanelType] = await db
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

    const createdPatchPanels = await db
        .insert(schema.devices)
        .values(patchPanelValues)
        .onConflictDoNothing()
        .returning();
    console.log(`  Created ${createdPatchPanels.length} patch panels`);

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

    console.log("Seeding complete!");
    await client.end();
}

seed().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
});
