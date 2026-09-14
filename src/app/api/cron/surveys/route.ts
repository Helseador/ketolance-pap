import { NextRequest, NextResponse } from "next/server";
import { dispatchDueSurveys } from "@/lib/survey";
import type { SlotKey } from "@/lib/time";

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const slotParam = request.nextUrl.searchParams.get("slot") as SlotKey | null;
  const force = request.nextUrl.searchParams.get("force") === "1";
  const result = await dispatchDueSurveys(
    force && slotParam ? slotParam : undefined,
  );
  return NextResponse.json(result);
}
