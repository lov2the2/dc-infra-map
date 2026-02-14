import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { PowerReadingEvent } from "@/types/entities";

type SseStatus = "disconnected" | "connecting" | "connected" | "error";

interface PowerState {
    liveReadings: Record<string, PowerReadingEvent>;
    sseStatus: SseStatus;
    isLoading: boolean;
    connectSSE: () => void;
    disconnectSSE: () => void;
}

// Store EventSource reference outside of Zustand (not serializable)
let eventSourceRef: EventSource | null = null;

export const usePowerStore = create<PowerState>()(
    immer((set, get) => ({
        liveReadings: {},
        sseStatus: "disconnected" as SseStatus,
        isLoading: false,

        connectSSE: () => {
            if (eventSourceRef) {
                eventSourceRef.close();
            }

            set((state) => {
                state.sseStatus = "connecting";
            });

            const es = new EventSource("/api/power/sse");
            eventSourceRef = es;

            es.onopen = () => {
                set((state) => {
                    state.sseStatus = "connected";
                });
            };

            es.onmessage = (event) => {
                try {
                    const readings: PowerReadingEvent[] = JSON.parse(event.data);
                    set((state) => {
                        for (const reading of readings) {
                            state.liveReadings[reading.feedId] = reading;
                        }
                    });
                } catch {
                    // Ignore parse errors
                }
            };

            es.onerror = () => {
                set((state) => {
                    state.sseStatus = "error";
                });
                setTimeout(() => {
                    if (get().sseStatus === "error") {
                        get().connectSSE();
                    }
                }, 5000);
            };
        },

        disconnectSSE: () => {
            if (eventSourceRef) {
                eventSourceRef.close();
                eventSourceRef = null;
            }
            set((state) => {
                state.sseStatus = "disconnected";
                state.liveReadings = {};
            });
        },
    })),
);
