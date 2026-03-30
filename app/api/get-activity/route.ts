import { NextResponse } from "next/server";

const VAULT_CONTRACT = process.env.NEXT_PUBLIC_VAULT_CONTRACT ?? "0xbd9a0dc67c96cda1";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        { error: "Address required" },
        { status: 400 }
      );
    }

    const normalizedAddress = address.toLowerCase();
    const currentHeight = await getCurrentHeight();
    if (!currentHeight) {
      return NextResponse.json({ activities: [] });
    }

    // Fetch all relevant events from Flow blockchain (same strategy as rules API)
    const [vaultCreatedEvents, depositEvents, ruleCreatedEvents, scheduledEvents] = await Promise.all([
      fetchFlowEvents(`A.${VAULT_CONTRACT.replace("0x", "")}.FlowPilotVault.VaultCreated`, normalizedAddress, "owner", currentHeight, 30),
      fetchFlowEvents(`A.${VAULT_CONTRACT.replace("0x", "")}.FlowPilotVault.Deposited`, normalizedAddress, "owner", currentHeight, 40),
      fetchFlowEvents(`A.${VAULT_CONTRACT.replace("0x", "")}.AutomationRulesV2.RuleCreated`, normalizedAddress, "owner", currentHeight, 120),
      fetchFlowEvents(`A.8c5303eaa26202d6.FlowTransactionScheduler.Scheduled`, normalizedAddress, "transactionHandlerOwner", currentHeight, 120),
    ]);

    console.log("Fetched events:", {
      vaultCreated: vaultCreatedEvents.length,
      deposits: depositEvents.length,
      rules: ruleCreatedEvents.length,
      scheduled: scheduledEvents.length,
    });

    // Combine and format events
    const activities = [
      ...vaultCreatedEvents.map((e: any) => ({
        id: `vault-${e.transactionId}-${e.eventIndex}`,
        text: "Vault initialized",
        when: formatTime(e.blockTimestamp),
        type: "rule" as const,
        txId: e.transactionId,
        timestamp: new Date(e.blockTimestamp).getTime(),
      })),
      ...depositEvents.map((e: any) => ({
        id: `deposit-${e.transactionId}-${e.eventIndex}`,
        text: `Saved ${parseFloat(e.data.amount).toFixed(2)} FLOW → Vault`,
        when: formatTime(e.blockTimestamp),
        type: "save" as const,
        txId: e.transactionId,
        timestamp: new Date(e.blockTimestamp).getTime(),
      })),
      ...ruleCreatedEvents.map((e: any) => ({
        id: `rule-${e.transactionId}-${e.eventIndex}`,
        text: `Automation rule created: ${e.data.actionType}`,
        when: formatTime(e.blockTimestamp),
        type: "rule" as const,
        txId: e.transactionId,
        timestamp: new Date(e.blockTimestamp).getTime(),
      })),
      ...scheduledEvents.map((e: any) => ({
        id: `scheduled-${e.transactionId}-${e.eventIndex}`,
        text: `Scheduled for ${new Date(parseFloat(e.data.timestamp) * 1000).toLocaleDateString()}`,
        when: formatTime(e.blockTimestamp),
        type: "rule" as const,
        txId: e.transactionId,
        timestamp: new Date(e.blockTimestamp).getTime(),
      })),
    ]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10);

    return NextResponse.json({ activities, count: activities.length, queriedAddress: normalizedAddress });
  } catch (error: any) {
    console.error("Get activity error:", error);
    return NextResponse.json({ activities: [] });
  }
}

async function getCurrentHeight(): Promise<number> {
  try {
    const blockResponse = await fetch("https://rest-testnet.onflow.org/v1/blocks?height=sealed", {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!blockResponse.ok) return 0;
    const blockData = await blockResponse.json();
    return Number(blockData?.[0]?.header?.height ?? 0);
  } catch {
    return 0;
  }
}

async function fetchFlowEvents(
  eventType: string,
  normalizedAddress: string,
  addressField: string,
  currentHeight: number,
  maxWindows: number
) {
  try {
    const ranges: Array<{ start: number; end: number }> = [];
    for (let i = 0; i < maxWindows; i++) {
      const end = Math.max(0, currentHeight - i * 250);
      const start = Math.max(0, end - 249);
      if (end <= 0) break;
      ranges.push({ start, end });
    }

    const out: Array<{ transactionId: string; eventIndex: string; blockTimestamp: string; data: Record<string, unknown> }> = [];
    const seen = new Set<string>();
    const batchSize = 8;

    for (let i = 0; i < ranges.length; i += batchSize) {
      const batch = ranges.slice(i, i + batchSize);
      const blocksList = await Promise.all(
        batch.map(async ({ start, end }) => {
          const url = `https://rest-testnet.onflow.org/v1/events?type=${encodeURIComponent(eventType)}&start_height=${start}&end_height=${end}`;
          const blocks = await fetchBlocksWithRetry(url);
          return Array.isArray(blocks) ? blocks : [];
        })
      );

      for (const blocks of blocksList) {
        for (const block of blocks) {
          for (const event of block.events ?? []) {
            const eventData = decodeCadencePayload(event.payload);
            if (!eventData) continue;

            const owner = String(eventData[addressField] ?? "").toLowerCase();
            if (owner !== normalizedAddress) continue;

            const key = `${event.transaction_id}:${event.event_index}`;
            if (seen.has(key)) continue;
            seen.add(key);

            out.push({
              transactionId: event.transaction_id,
              eventIndex: String(event.event_index),
              blockTimestamp: block.block_timestamp,
              data: eventData,
            });
          }
        }
      }

      // Activity feed only needs a small recent sample
      if (out.length >= 30) {
        break;
      }
    }

    return out;
  } catch (error) {
    console.error(`Failed to fetch ${eventType}:`, error);
    return [];
  }
}

async function fetchBlocksWithRetry(url: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (response.ok) {
      return await response.json();
    }

    await new Promise((r) => setTimeout(r, 120 * (attempt + 1)));
  }

  return [];
}

function decodeCadencePayload(payloadBase64: string): Record<string, unknown> | null {
  try {
    const payload = JSON.parse(Buffer.from(payloadBase64, "base64").toString());
    const data: Record<string, unknown> = {};
    for (const field of payload?.value?.fields ?? []) {
      data[field.name] = decodeCadenceValue(field.value);
    }
    return data;
  } catch {
    return null;
  }
}

function decodeCadenceValue(value: any): unknown {
  if (!value || typeof value !== "object") return value;

  switch (value.type) {
    case "Optional":
      return value.value ? decodeCadenceValue(value.value) : null;
    case "UInt8":
    case "UInt16":
    case "UInt32":
    case "UInt64":
    case "UInt128":
    case "UInt256":
    case "Int8":
    case "Int16":
    case "Int32":
    case "Int64":
    case "Int128":
    case "Int256":
    case "Word8":
    case "Word16":
    case "Word32":
    case "Word64":
    case "Fix64":
    case "UFix64":
    case "Address":
    case "String":
    case "Bool":
      return value.value;
    default:
      return value.value ?? null;
  }
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}
