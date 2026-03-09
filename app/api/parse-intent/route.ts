import { NextResponse } from "next/server";
import { parseIntent } from "@/lib/nearai";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = String(body?.message ?? "");

    if (!message.trim()) {
      return NextResponse.json(
        {
          understood: false,
          clarificationNeeded: "Please describe your goal first.",
        },
        { status: 400 }
      );
    }

    const result = await parseIntent(message);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      {
        understood: false,
        clarificationNeeded: "Unable to parse request right now.",
      },
      { status: 500 }
    );
  }
}
