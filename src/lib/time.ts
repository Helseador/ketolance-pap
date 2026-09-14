export const TIMEZONE = "America/Bogota";

export const SLOTS = {
  MANANA: { hour: 8, label: "Mañana (8:00)" },
  MEDIODIA: { hour: 12, label: "Mediodía (12:00)" },
  TARDE: { hour: 16, label: "Tarde (16:00)" },
} as const;

export type SlotKey = keyof typeof SLOTS;

export function bogotaParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const hourRaw = get("hour");
  const hour = hourRaw === "24" ? 0 : Number(hourRaw);

  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    hour,
    minute: Number(get("minute")),
  };
}

export function slotForHour(hour: number): SlotKey | null {
  if (hour === 8) return "MANANA";
  if (hour === 12) return "MEDIODIA";
  if (hour === 16) return "TARDE";
  return null;
}

export function formatBogota(date: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: TIMEZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
