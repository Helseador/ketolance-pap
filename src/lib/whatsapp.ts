const GRAPH = "https://graph.facebook.com/v21.0";

export function whatsappConfigured() {
  return Boolean(
    process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID,
  );
}

export async function sendWhatsAppText(to: string, body: string) {
  return sendWhatsApp(to, {
    type: "text",
    text: { preview_url: false, body },
  });
}

export async function sendWhatsAppYesNo(to: string, body: string) {
  return sendWhatsApp(to, {
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: body },
      action: {
        buttons: [
          { type: "reply", reply: { id: "SI", title: "Sí" } },
          { type: "reply", reply: { id: "NO", title: "No" } },
        ],
      },
    },
  });
}

export async function sendWhatsAppMood(to: string, body: string) {
  return sendWhatsApp(to, {
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: body },
      action: {
        buttons: [
          { type: "reply", reply: { id: "BIEN",    title: "😊 Bien" } },
          { type: "reply", reply: { id: "REGULAR", title: "😐 Regular" } },
          { type: "reply", reply: { id: "MAL",     title: "😔 Mal" } },
        ],
      },
    },
  });
}

async function sendWhatsApp(to: string, payload: Record<string, unknown>) {
  if (!whatsappConfigured()) {
    console.info("[whatsapp:dry-run]", to, payload);
    return { ok: true, dryRun: true as const, id: `dry-${Date.now()}` };
  }

  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const res = await fetch(`${GRAPH}/${phoneId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: to.replace(/\D/g, ""),
      ...payload,
    }),
  });

  const data = (await res.json()) as {
    messages?: { id: string }[];
    error?: { message: string };
  };

  if (!res.ok) {
    throw new Error(data.error?.message ?? "Error enviando WhatsApp");
  }

  return { ok: true, dryRun: false as const, id: data.messages?.[0]?.id };
}

export function normalizeReply(text: string) {
  const value = text.trim().toLowerCase();
  if (["si", "sí", "yes", "1"].includes(value)) return "SI";
  if (["no", "nop", "0"].includes(value)) return "NO";
  return text.trim();
}
