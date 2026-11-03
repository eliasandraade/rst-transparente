import { orkenConfig } from "@/lib/orken/config";
import { startPlatformEventsLoop } from "@/lib/orken/events";

/** Chamado uma vez por réplica (instrumentation.ts). */
export function startOrkenServices(): void {
  orkenConfig();
  startPlatformEventsLoop();
}
