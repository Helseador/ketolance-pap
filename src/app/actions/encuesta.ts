"use server";

import { prisma } from "@/lib/prisma";
import { bogotaParts, slotForHour } from "@/lib/time";

export async function getPatientByToken(token: string) {
  return prisma.patient.findFirst({
    where: { surveyToken: token, active: true, ketolanceActive: true },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      surveyToken: true,
    },
  });
}

export async function loginByDocument(documentId: string) {
  const patient = await prisma.patient.findFirst({
    where: { documentId: documentId.trim(), active: true },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      surveyToken: true,
      diagnosis: true,
      ketolanceActive: true,
    },
  });
  if (!patient) return null;

  // Encuestas del mes actual
  const { date } = bogotaParts();
  const month = date.slice(0, 7); // YYYY-MM
  const surveys = await prisma.survey.findMany({
    where: { patientId: patient.id, localDate: { startsWith: month } },
    orderBy: [{ localDate: "desc" }, { slot: "asc" }],
    take: 30,
  });

  const completed = surveys.filter((s) => s.status === "COMPLETED").length;
  const total = surveys.length;

  // Encuesta de hoy pendiente
  const todaySurveys = surveys.filter((s) => s.localDate === date);
  const slots = ["MANANA", "MEDIODIA", "TARDE"];
  const nextSlot = slots.find(
    (sl) => !todaySurveys.find((s) => s.slot === sl && s.status === "COMPLETED"),
  );

  // Última encuesta completada
  const lastCompleted = surveys.find((s) => s.status === "COMPLETED");

  return {
    ...patient,
    stats: { completed, total, month },
    nextSlot: nextSlot ?? null,
    lastSurveyDate: lastCompleted?.localDate ?? null,
  };
}

export async function getPasaporteByPatientId(patientId: string) {
  const [pasaporte, surveys] = await Promise.all([
    prisma.pasaporte.findUnique({ where: { patientId } }),
    prisma.survey.findMany({
      where: { patientId },
      orderBy: [{ localDate: "desc" }, { slot: "asc" }],
    }),
  ]);
  return { pasaporte, surveys };
}

export async function submitEncuesta(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const slotOverride = String(formData.get("slotOverride") ?? "") as
    | "MANANA"
    | "MEDIODIA"
    | "TARDE"
    | "";

  const patient = await prisma.patient.findFirst({
    where: { surveyToken: token, active: true },
  });
  if (!patient) throw new Error("Paciente no encontrado");

  const { date, hour } = bogotaParts();
  const slot =
    slotOverride ||
    slotForHour(hour) ||
    (hour < 12 ? "MANANA" : hour < 16 ? "MEDIODIA" : "TARDE");

  const str = (key: string) => String(formData.get(key) ?? "").trim() || null;

  // Buscar encuesta existente del turno o crear nueva
  const existing = await prisma.survey.findUnique({
    where: { patientId_localDate_slot: { patientId: patient.id, localDate: date, slot } },
  });

  const data = {
    vomitos:           str("vomitos"),
    diarrea:           str("diarrea"),
    fiebre:            str("fiebre"),
    temperaturaFiebre: str("temperaturaFiebre"),
    numeroCrisis:      str("numeroCrisis"),
    transgresionDieta: str("transgresionDieta"),
    cambioFae:         str("cambioFae"),
    glucosa:           str("glucosa"),
    cetonas:           str("cetonas"),
    estadoAnimo:       str("estadoAnimo"),
    peso:              slot === "MANANA" ? str("peso") : null,
    observaciones:     str("observaciones"),
    status:            "COMPLETED" as const,
    completedAt:       new Date(),
  };

  if (existing) {
    await prisma.survey.update({ where: { id: existing.id }, data });
  } else {
    await prisma.survey.create({
      data: {
        patientId: patient.id,
        slot,
        localDate: date,
        currentStep: "VOMITOS",
        sentAt: new Date(),
        ...data,
      },
    });
  }

  return { ok: true, patientName: `${patient.firstName} ${patient.lastName}` };
}
