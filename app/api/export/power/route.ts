import { isNull } from "drizzle-orm";
import { db } from "@/db";
import { powerPanels, powerFeeds } from "@/db/schema";
import { createWorkbook, addSheet, workbookToBlob } from "@/lib/export/excel";
import { withAuthOnly } from "@/lib/auth/with-auth";

export const GET = withAuthOnly(async (_req, _session) => {
    const panels = await db.query.powerPanels.findMany({
        where: isNull(powerPanels.deletedAt),
        with: { site: true },
    });

    const feeds = await db.query.powerFeeds.findMany({
        where: isNull(powerFeeds.deletedAt),
        with: {
            panel: true,
            rack: true,
        },
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

    const wb = createWorkbook();
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

    const date = new Date().toISOString().split("T")[0];
    const filename = `dcim-power-${date}.xlsx`;
    const blob = await workbookToBlob(wb);

    return new Response(blob, {
        headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="${filename}"`,
        },
    });
});
