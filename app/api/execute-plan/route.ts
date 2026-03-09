import { NextResponse } from "next/server";
import { initializeVault, createAutomationRule, depositToVault } from "@/lib/cadence";

export async function POST(request: Request) {
  try {
    const plan = await request.json();

    if (!plan?.understood || !plan?.actions) {
      return NextResponse.json(
        { ok: false, message: "Invalid plan" },
        { status: 400 }
      );
    }

    const userAddress = plan.userAddress || undefined;

    // Initialize vault first (idempotent - does nothing if already exists)
    await initializeVault(userAddress);

    const txIds: string[] = [];

    // Execute each action
    for (const action of plan.actions) {
      if (action.type === "SCHEDULED_SAVE" && action.amount && action.intervalDays) {
        const txId = await createAutomationRule(
          action.type,
          action.amount,
          action.intervalDays,
          userAddress
        );
        txIds.push(txId);
      } else if (action.type === "AUTO_YIELD" && action.amount) {
        const txId = await depositToVault(action.amount, userAddress);
        txIds.push(txId);
      } else if (action.type === "DCA" && action.amount && action.intervalDays) {
        const txId = await createAutomationRule(
          action.type,
          action.amount,
          action.intervalDays,
          userAddress
        );
        txIds.push(txId);
      }
    }

    return NextResponse.json({
      ok: true,
      status: "executed",
      message: "Plan executed successfully",
      txIds,
    });
  } catch (error: any) {
    console.error("Execute plan error:", error);
    return NextResponse.json(
      {
        ok: false,
        message: error?.message || "Could not execute plan.",
      },
      { status: 500 }
    );
  }
}
