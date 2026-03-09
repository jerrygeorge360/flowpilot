import { NextResponse } from "next/server";
import { getVaultMetrics } from "@/lib/cadence";

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

    const metrics = await getVaultMetrics(address);

    return NextResponse.json(metrics);
  } catch (error: any) {
    console.error("Get balance error:", error);
    return NextResponse.json({ balance: 0, principal: 0, pendingYield: 0, apy: 5 });
  }
}
