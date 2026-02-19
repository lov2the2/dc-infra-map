import * as cron from "node-cron";
import { eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { reportSchedules } from "@/db/schema";
import { createWorkbook, addSheet, workbookToBlob } from "@/lib/export/excel";
import { sendReportEmail } from "@/lib/mailer/report-mailer";
import { devices, racks, cables, powerPanels, powerFeeds, accessLogs } from "@/db/schema";

const scheduledTasks = new Map<string, cron.ScheduledTask>();

async function generateReportBuffer(reportType: string): Promise<Buffer> {
    const wb = createWorkbook();

    if (reportType === "devices") {
        const result = await db.query.devices.findMany({
            where: isNull(devices.deletedAt),
            with: {
                deviceType: { with: { manufacturer: true } },
                rack: { with: { location: { with: { site: true } } } },
                tenant: true,
            },
        });

        const rows = result.map((d) => ({
            name: d.name,
            type: d.deviceType.model,
            manufacturer: d.deviceType.manufacturer.name,
            rack: d.rack?.name ?? "",
            position: d.position ?? "",
            status: d.status,
            serial: d.serialNumber ?? "",
            assetTag: d.assetTag ?? "",
            tenant: d.tenant?.name ?? "",
        }));

        addSheet(wb, "Devices", [
            { header: "Name", key: "name" },
            { header: "Type", key: "type" },
            { header: "Manufacturer", key: "manufacturer" },
            { header: "Rack", key: "rack" },
            { header: "Position", key: "position", width: 10 },
            { header: "Status", key: "status", width: 15 },
            { header: "Serial", key: "serial" },
            { header: "Asset Tag", key: "assetTag" },
            { header: "Tenant", key: "tenant" },
        ], rows);
    } else if (reportType === "racks") {
        const result = await db.query.racks.findMany({
            where: isNull(racks.deletedAt),
            with: {
                location: { with: { site: true } },
                devices: { with: { deviceType: true } },
            },
        });

        const rows: Record<string, unknown>[] = [];
        for (const rack of result) {
            if (rack.devices.length === 0) {
                rows.push({
                    rackName: rack.name,
                    location: rack.location.name,
                    site: rack.location.site.name,
                    uHeight: rack.uHeight,
                    deviceName: "",
                    position: "",
                    deviceType: "",
                    status: "",
                });
            } else {
                for (const device of rack.devices) {
                    rows.push({
                        rackName: rack.name,
                        location: rack.location.name,
                        site: rack.location.site.name,
                        uHeight: rack.uHeight,
                        deviceName: device.name,
                        position: device.position ?? "",
                        deviceType: device.deviceType.model,
                        status: device.status,
                    });
                }
            }
        }

        addSheet(wb, "Racks", [
            { header: "Rack Name", key: "rackName" },
            { header: "Location", key: "location" },
            { header: "Site", key: "site" },
            { header: "U-Height", key: "uHeight", width: 10 },
            { header: "Device Name", key: "deviceName" },
            { header: "Position", key: "position", width: 10 },
            { header: "Device Type", key: "deviceType" },
            { header: "Status", key: "status", width: 15 },
        ], rows);
    } else if (reportType === "cables") {
        const result = await db.query.cables.findMany({
            where: isNull(cables.deletedAt),
            with: { tenant: true },
        });

        const rows = result.map((c) => ({
            label: c.label,
            type: c.cableType,
            status: c.status,
            sideAType: c.terminationAType,
            sideAId: c.terminationAId,
            sideBType: c.terminationBType,
            sideBId: c.terminationBId,
            length: c.length ?? "",
            color: c.color ?? "",
            tenant: c.tenant?.name ?? "",
        }));

        addSheet(wb, "Cables", [
            { header: "Label", key: "label" },
            { header: "Type", key: "type" },
            { header: "Status", key: "status", width: 15 },
            { header: "Side A Type", key: "sideAType" },
            { header: "Side A ID", key: "sideAId" },
            { header: "Side B Type", key: "sideBType" },
            { header: "Side B ID", key: "sideBId" },
            { header: "Length", key: "length", width: 10 },
            { header: "Color", key: "color", width: 10 },
            { header: "Tenant", key: "tenant" },
        ], rows);
    } else if (reportType === "power") {
        const panels = await db.query.powerPanels.findMany({
            where: isNull(powerPanels.deletedAt),
            with: { site: true },
        });

        const feeds = await db.query.powerFeeds.findMany({
            where: isNull(powerFeeds.deletedAt),
            with: { panel: true, rack: true },
        });

        const panelRows = panels.map((p) => ({
            name: p.name,
            site: p.site.name,
            location: p.location ?? "",
            ratedKw: p.ratedCapacityKw,
            voltage: p.voltageV,
            phase: p.phaseType,
        }));

        const feedRows = feeds.map((f) => ({
            name: f.name,
            panel: f.panel.name,
            rack: f.rack?.name ?? "",
            feedType: f.feedType,
            maxAmps: f.maxAmps,
            ratedKw: f.ratedKw,
        }));

        addSheet(wb, "Panels", [
            { header: "Panel Name", key: "name" },
            { header: "Site", key: "site" },
            { header: "Location", key: "location" },
            { header: "Rated KW", key: "ratedKw", width: 12 },
            { header: "Voltage", key: "voltage", width: 10 },
            { header: "Phase", key: "phase", width: 10 },
        ], panelRows);

        addSheet(wb, "Feeds", [
            { header: "Feed Name", key: "name" },
            { header: "Panel", key: "panel" },
            { header: "Rack", key: "rack" },
            { header: "Feed Type", key: "feedType", width: 12 },
            { header: "Max Amps", key: "maxAmps", width: 12 },
            { header: "Rated KW", key: "ratedKw", width: 12 },
        ], feedRows);
    } else if (reportType === "access") {
        const result = await db.query.accessLogs.findMany({
            where: isNull(accessLogs.deletedAt),
            with: { site: true },
        });

        function formatDate(date: Date | null): string {
            if (!date) return "";
            return date.toISOString().replace("T", " ").substring(0, 19);
        }

        const rows = result.map((log) => ({
            personnel: log.personnelName,
            company: log.company ?? "",
            accessType: log.accessType,
            status: log.status,
            site: log.site.name,
            checkIn: formatDate(log.checkInAt),
            checkOut: formatDate(log.actualCheckOutAt),
            purpose: log.purpose ?? "",
            badge: log.badgeNumber ?? "",
        }));

        addSheet(wb, "Access Logs", [
            { header: "Personnel", key: "personnel" },
            { header: "Company", key: "company" },
            { header: "Access Type", key: "accessType", width: 15 },
            { header: "Status", key: "status", width: 15 },
            { header: "Site", key: "site" },
            { header: "Check In", key: "checkIn", width: 22 },
            { header: "Check Out", key: "checkOut", width: 22 },
            { header: "Purpose", key: "purpose", width: 30 },
            { header: "Badge", key: "badge", width: 12 },
        ], rows);
    }

    const blob = await workbookToBlob(wb);
    const arrayBuffer = await blob.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

interface ScheduleInput {
    id: string;
    name: string;
    reportType: string;
    cronExpression: string;
    recipientEmails: string[];
}

export async function runSchedule(schedule: ScheduleInput): Promise<void> {
    const date = new Date().toISOString().split("T")[0];
    const filename = `dcim-${schedule.reportType}-${date}.xlsx`;
    const buffer = await generateReportBuffer(schedule.reportType);

    await sendReportEmail(
        schedule.recipientEmails,
        `[DCIM] Scheduled Report: ${schedule.name}`,
        filename,
        buffer
    );

    await db
        .update(reportSchedules)
        .set({
            lastRunAt: new Date(),
            nextRunAt: getNextRunAt(schedule.cronExpression),
            updatedAt: new Date(),
        })
        .where(eq(reportSchedules.id, schedule.id));
}

export function getNextRunAt(cronExpression: string): Date {
    // Parse simple cron expression to estimate next run time
    // For complex expressions, fall back to 24 hours from now
    try {
        const parts = cronExpression.trim().split(/\s+/);
        if (parts.length < 5) {
            return new Date(Date.now() + 24 * 60 * 60 * 1000);
        }

        const [minute, hour] = parts;

        // Hourly: * * * * *  or  0 * * * *
        if (hour === "*") {
            return new Date(Date.now() + 60 * 60 * 1000);
        }

        // Daily: 0 8 * * *
        if (
            minute !== "*" &&
            hour !== "*" &&
            parts[2] === "*" &&
            parts[3] === "*" &&
            parts[4] === "*"
        ) {
            return new Date(Date.now() + 24 * 60 * 60 * 1000);
        }

        // Weekly: 0 8 * * 1
        if (parts[4] !== "*") {
            return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        }

        // Monthly: 0 8 1 * *
        if (parts[2] !== "*") {
            return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        }
    } catch {
        // Fall through to default
    }

    return new Date(Date.now() + 24 * 60 * 60 * 1000);
}

export async function initScheduler(): Promise<void> {
    const activeSchedules = await db
        .select()
        .from(reportSchedules)
        .where(eq(reportSchedules.isActive, true));

    for (const schedule of activeSchedules) {
        registerCronJob(schedule);
    }

    console.log(`[Scheduler] Initialized ${activeSchedules.length} report schedule(s)`);
}

export function stopScheduler(): void {
    for (const [id, task] of scheduledTasks) {
        task.stop();
        scheduledTasks.delete(id);
    }
    console.log("[Scheduler] All scheduled tasks stopped");
}

export async function reloadSchedule(id: string): Promise<void> {
    // Stop existing task if any
    const existing = scheduledTasks.get(id);
    if (existing) {
        existing.stop();
        scheduledTasks.delete(id);
    }

    // Load latest schedule from DB
    const [schedule] = await db
        .select()
        .from(reportSchedules)
        .where(eq(reportSchedules.id, id));

    if (!schedule) return;

    if (schedule.isActive) {
        registerCronJob(schedule);
    }
}

function registerCronJob(schedule: typeof reportSchedules.$inferSelect): void {
    if (!cron.validate(schedule.cronExpression)) {
        console.warn(`[Scheduler] Invalid cron expression for schedule "${schedule.name}": ${schedule.cronExpression}`);
        return;
    }

    const task = cron.schedule(schedule.cronExpression, async () => {
        console.log(`[Scheduler] Running scheduled report: ${schedule.name}`);
        try {
            await runSchedule({
                id: schedule.id,
                name: schedule.name,
                reportType: schedule.reportType,
                cronExpression: schedule.cronExpression,
                recipientEmails: schedule.recipientEmails,
            });
            console.log(`[Scheduler] Completed scheduled report: ${schedule.name}`);
        } catch (error) {
            console.error(`[Scheduler] Failed to run report "${schedule.name}":`, error);
        }
    });

    scheduledTasks.set(schedule.id, task);
}
