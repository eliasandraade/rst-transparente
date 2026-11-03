import { prisma } from "@/lib/prisma";
import { isUuid, orkenConfig, type OrkenConfig } from "@/lib/orken/config";
import { platformEvents, type PlatformEvent } from "@/lib/orken/platform";
import { clearAccessCache } from "@/lib/orken/access";

/**
 * Consumidor do feed de eventos da Platform. Evento nunca concede nada: um evento
 * relevante só sobe a versão de acesso (platform_access_state), o que aposenta em
 * todas as réplicas as respostas guardadas; a próxima requisição pergunta de novo.
 * O TTL do cache (60 s) segue como segunda barreira se o feed atrasar.
 *
 * Cursor persistido e movido só por compare-and-set: um restart retoma de onde
 * parou e duas réplicas nunca aplicam a mesma página; recibo por evento torna a
 * reentrega um no-op. Evento malformado é pulado (não trava o feed) e aposenta o
 * cache por precaução: perguntar de novo é barato, perder uma revogação não.
 */

export const CONSUMER = "cond-access";
export const PAGE_SIZE = 100;
const MAX_PAGES_PER_RUN = 20;
const RECEIPT_RETENTION_DAYS = 14;

export const ACCESS_EVENT_TYPES = new Set([
  "organization.updated.v1",
  "organization.product_enabled.v1",
  "organization.product_disabled.v1",
  "entitlement.changed.v1",
  "membership.created.v1",
  "membership.changed.v1",
  "membership.removed.v1",
]);

export interface SyncResult {
  pages: number;
  received: number;
  relevant: number;
  duplicates: number;
  ignored: number;
  yielded: boolean;
  retired: boolean;
}

function wellFormed(event: PlatformEvent | null | undefined): event is PlatformEvent {
  if (!event || typeof event !== "object") return false;
  const organizationId = event.organizationId ?? null;
  return (
    isUuid(event.id) &&
    typeof event.type === "string" &&
    event.type.length > 0 &&
    event.type.length <= 120 &&
    (organizationId === null || isUuid(organizationId))
  );
}

/** Organizações da Platform atendidas por este COND (as do registro com vínculo). */
async function servedOrganizations(): Promise<Set<string>> {
  const rows = await prisma.organization.findMany({
    where: { platformOrganizationId: { not: null } },
    select: { platformOrganizationId: true },
  });
  return new Set(rows.map((row) => row.platformOrganizationId!.toLowerCase()));
}

export async function syncPlatformEvents(config: OrkenConfig): Promise<SyncResult> {
  const result: SyncResult = { pages: 0, received: 0, relevant: 0, duplicates: 0, ignored: 0, yielded: false, retired: false };
  const ours = await servedOrganizations();
  for (let page = 0; page < MAX_PAGES_PER_RUN; page++) {
    const cursor = (await prisma.platformEventCursor.findUnique({ where: { consumer: CONSUMER }, select: { cursor: true } }))?.cursor ?? null;
    let events: PlatformEvent[];
    let nextCursor: string;
    try {
      ({ events, nextCursor } = await platformEvents(config, cursor, PAGE_SIZE));
    } catch (error) {
      await recordFailure(cursor, error);
      throw error;
    }
    if (events.length === 0 && nextCursor === cursor) break;

    const applied = await applyPage(cursor, nextCursor, events, ours);
    if (!applied) {
      result.yielded = true;
      break;
    }
    result.pages++;
    result.received += events.length;
    result.relevant += applied.relevant;
    result.duplicates += applied.duplicates;
    result.ignored += applied.ignored;
    result.retired ||= applied.retired;
    if (events.length < PAGE_SIZE) break;
  }
  await prisma.platformEventReceipt.deleteMany({
    where: { receivedAt: { lt: new Date(Date.now() - RECEIPT_RETENTION_DAYS * 86_400_000) } },
  });
  if (result.retired) clearAccessCache();
  if (result.received > 0) {
    console.log(`[platform-events] ${result.received} recebidos, ${result.relevant} relevantes, ${result.duplicates} repetidos, ${result.ignored} ignorados`);
  }
  return result;
}

async function applyPage(
  cursor: string | null,
  nextCursor: string,
  events: PlatformEvent[],
  ours: ReadonlySet<string>
): Promise<{ relevant: number; duplicates: number; ignored: number; retired: boolean } | null> {
  return prisma.$transaction(async (tx) => {
    if (cursor === null) {
      const created = await tx.$executeRaw`
        INSERT INTO "platform_event_cursors" ("consumer", "cursor", "updatedAt") VALUES (${CONSUMER}, ${nextCursor}, now())
        ON CONFLICT ("consumer") DO NOTHING`;
      if (created !== 1) return null;
    } else {
      const moved = await tx.platformEventCursor.updateMany({
        where: { consumer: CONSUMER, cursor },
        data: { cursor: nextCursor, failures: 0, lastError: null },
      });
      if (moved.count !== 1) return null;
    }

    let relevant = 0;
    let duplicates = 0;
    let ignored = 0;
    let retire = false;
    for (const event of events) {
      if (!wellFormed(event)) {
        console.warn("[platform-events] evento malformado ignorado");
        ignored++;
        retire = true;
        continue;
      }
      const inserted = await tx.$executeRaw`
        INSERT INTO "platform_event_receipts" ("eventId", "type", "receivedAt") VALUES (${event.id}::uuid, ${event.type}, now())
        ON CONFLICT ("eventId") DO NOTHING`;
      if (inserted !== 1) {
        duplicates++;
        continue;
      }
      const organization = event.organizationId?.toLowerCase() ?? null;
      if (ACCESS_EVENT_TYPES.has(event.type) && (organization === null || ours.has(organization))) {
        relevant++;
        retire = true;
      } else {
        ignored++;
      }
    }
    if (retire) {
      await tx.platformAccessState.update({ where: { id: 1 }, data: { accessVersion: { increment: 1 } } });
    }
    return { relevant, duplicates, ignored, retired: retire };
  });
}

async function recordFailure(cursor: string | null, error: unknown): Promise<void> {
  if (cursor === null) return;
  const message = (error instanceof Error ? error.message : "erro").slice(0, 300);
  await prisma.platformEventCursor
    .updateMany({ where: { consumer: CONSUMER }, data: { failures: { increment: 1 }, lastError: message } })
    .catch(() => undefined);
}

const globalForFeed = globalThis as unknown as { condFeedTimer?: NodeJS.Timeout };

/** Agenda o consumidor nesta réplica (instrumentation.ts): 15 s, recuando até 5 min se a Platform falhar. */
export function startPlatformEventsLoop(): void {
  const config = orkenConfig();
  if (!config || !config.eventsSync || globalForFeed.condFeedTimer) return;
  let delay = 15_000;
  const run = async () => {
    try {
      await syncPlatformEvents(config);
      delay = 15_000;
    } catch (error) {
      delay = Math.min(delay * 2, 5 * 60_000);
      console.error(`[platform-events] ${error instanceof Error ? error.message : "erro"}; nova tentativa em ${Math.round(delay / 1000)} s`);
    }
    globalForFeed.condFeedTimer = setTimeout(run, delay);
    globalForFeed.condFeedTimer.unref?.();
  };
  globalForFeed.condFeedTimer = setTimeout(run, 2_000);
  globalForFeed.condFeedTimer.unref?.();
}
