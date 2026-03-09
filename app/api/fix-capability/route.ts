import { NextResponse } from "next/server";
import { publishRuleBookCapability } from "@/lib/cadence";

export async function POST(request: Request) {
  try {
    const { userAddress } = await request.json();

    if (!userAddress) {
      return NextResponse.json({ error: "User address required" }, { status: 400 });
    }

    const txId = await publishRuleBookCapability(userAddress);

    return NextResponse.json({
      success: true,
      txId,
      message: "RuleBook capability published successfully",
    });
  } catch (error: any) {
    console.error("Publish capability error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to publish capability",
        success: false,
      },
      { status: 500 }
    );
  }
}
