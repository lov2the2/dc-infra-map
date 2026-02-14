"use client";

import { useRackStore } from "@/stores/use-rack-store";
import { RackSlot } from "./rack-slot";
import { DeviceBlock } from "./device-block";
import type { Device, DeviceType } from "@/types/entities";

// NetBox convention: U1 = bottom, so U1 renders at the bottom of the grid
function uPositionToGridRow(position: number, uHeight: number, rackHeight: number): number {
    return rackHeight - position - uHeight + 2;
}

export function RackGrid() {
    const { activeRack, activeFace } = useRackStore();

    if (!activeRack) return null;

    const rackHeight = activeRack.uHeight;

    // Filter devices for the active face that have positions
    const faceDevices = activeRack.devices.filter(
        (d) => d.face === activeFace && d.position !== null,
    );

    // Build occupied slots map
    const occupiedSlots = new Set<number>();
    faceDevices.forEach((device) => {
        for (let u = device.position!; u < device.position! + device.deviceType.uHeight; u++) {
            occupiedSlots.add(u);
        }
    });

    return (
        <div className="inline-block border rounded-lg bg-muted/30 overflow-hidden">
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "3rem 1fr",
                    gridTemplateRows: `repeat(${rackHeight}, 1.75rem)`,
                    width: "24rem",
                }}
            >
                {/* Render U labels and empty slots */}
                {Array.from({ length: rackHeight }, (_, i) => {
                    const uPosition = rackHeight - i; // Top of grid = highest U
                    const gridRow = i + 1;
                    const isOccupied = occupiedSlots.has(uPosition);

                    return (
                        <div key={`label-${uPosition}`} className="contents">
                            {/* U label */}
                            <div
                                className="flex items-center justify-center text-[10px] text-muted-foreground border-b border-r bg-muted/50 font-mono"
                                style={{ gridRow, gridColumn: 1 }}
                            >
                                {uPosition}
                            </div>
                            {/* Slot or device occupies this space */}
                            {!isOccupied && (
                                <RackSlot
                                    position={uPosition}
                                    gridRow={gridRow}
                                />
                            )}
                        </div>
                    );
                })}

                {/* Render device blocks */}
                {faceDevices.map((device) => {
                    const startRow = uPositionToGridRow(
                        device.position!,
                        device.deviceType.uHeight,
                        rackHeight,
                    );
                    return (
                        <DeviceBlock
                            key={device.id}
                            device={device as Device & { deviceType: DeviceType }}
                            startRow={startRow}
                            uHeight={device.deviceType.uHeight}
                        />
                    );
                })}
            </div>
        </div>
    );
}
