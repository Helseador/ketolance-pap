import { NextRequest, NextResponse } from "next/server";
import { handleIncomingWhatsApp } from "@/lib/survey";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("hub.mode");
  const token = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

type WhatsAppPayload = {
  entry?: {
    changes?: {
      value?: {
        messages?: {
          from: string;
          type: string;
          text?: { body: string };
          button?: { text: string };
          interactive?: {
            button_reply?: { id: string; title: string };
            list_reply?: { id: string; title: string };
          };
        }[];
      };
    }[];
  }[];
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as WhatsAppPayload;
  const messages = body.entry?.flatMap((e) =>
    e.changes?.flatMap((c) => c.value?.messages ?? []) ?? [],
  ) ?? [];

  for (const message of messages) {
    const text =
      message.interactive?.button_reply?.id ??
      message.interactive?.button_reply?.title ??
      message.button?.text ??
      message.text?.body ??
      "";
    if (!message.from || !text) continue;
    await handleIncomingWhatsApp(message.from, text);
  }

  return NextResponse.json({ ok: true });
}
