import { NextResponse } from "next/server";
import { getUserRules } from "@/lib/cadence";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json({ error: "Address required" }, { status: 400 });
    }

    const rules = await getUserRules(address);

    return NextResponse.json({
      rules,
      count: rules.length,
      queriedAddress: address.toLowerCase(),
    });
  } catch (error: any) {
    console.error("Get rules error:", error);
    return NextResponse.json({ rules: [] , count: 0});
  }
}
