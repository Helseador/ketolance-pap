import { prisma } from "./prisma";
import { bogotaParts, slotForHour, type SlotKey } from "./time";
import {
  fieldsForSlot,
  firstField,
  nextField,
  fieldById,
  normalizeAnswer,
} from "./survey-copy";
import { sendWhatsAppText, sendWhatsAppYesNo, sendWhatsAppMood } from "./whatsapp";

/* ------------------------------------------------------------------ */
/* Dispatch: envía la primera pregunta a todos los pacientes activos     */
/* ------------------------------------------------------------------ */
export async function dispatchDueSurveys(forceSlot?: SlotKey) {
  const parts = bogotaParts();
  const slot = forceSlot ?? slotForHour(parts.hour);
  if (!slot) {
    return {
      skipped: true,
      reason: "Fuera de horario 8:00 / 12:00 / 16:00",
      date: parts.date,
    };
  }

  const patients = await prisma.patient.findMany({
    where: { active: true, ketolanceActive: true },
  });

  const results: { patientId: string; status: string; error?: string }[] = [];

  for (const patient of patients) {
    try {
      const existing = await prisma.survey.findUnique({
        where: {
          patientId_localDate_slot: {
            patientId: patient.id,
            localDate: parts.date,
            slot,
          },
        },
      });
      if (existing) {
        results.push({ patientId: patient.id, status: "already_exists" });
        continue;
      }

      const first = firstField(slot);

      const survey = await prisma.survey.create({
        data: {
          patientId: patient.id,
          slot,
          localDate: parts.date,
          status: "IN_PROGRESS",
          currentStep: first.id,
        },
      });

      const sent = await sendQuestion(patient.phone, first);
      await prisma.survey.update({
        where: { id: survey.id },
        data: { sentAt: new Date(), lastWhatsappId: sent.id },
      });

      results.push({
        patientId: patient.id,
        status: sent.dryRun ? "dry_run" : "sent",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error";
      results.push({ patientId: patient.id, status: "failed", error: message });
    }
  }

  return { skipped: false, date: parts.date, slot, results };
}

/* ------------------------------------------------------------------ */
/* Manejo de respuestas entrantes de WhatsApp                           */
/* ------------------------------------------------------------------ */
export async function handleIncomingWhatsApp(from: string, text: string) {
  const phone = from.replace(/\D/g, "");

  const patient = await prisma.patient.findFirst({
    where: {
      OR: [
        { phone: { contains: phone } },
        { caregiverPhone: { contains: phone } },
      ],
    },
  });

  if (!patient) {
    await sendWhatsAppText(
      from,
      "Este número no está registrado en el Programa de Apoyo a Pacientes de Helse Colombia. Si cree que es un error, comuníquese con su nutricionista.",
    );
    return { ignored: true };
  }

  const survey = await prisma.survey.findFirst({
    where: { patientId: patient.id, status: { in: ["PENDING", "IN_PROGRESS"] } },
    orderBy: { createdAt: "desc" },
  });

  if (!survey) {
    await sendWhatsAppText(
      patient.phone,
      "Gracias 😊 En este momento no hay una encuesta activa. Le escribiremos en el próximo turno (8:00, 12:00 o 16:00).",
    );
    return { ignored: true };
  }

  const field = fieldById(survey.currentStep);
  const { value, valid, hint } = normalizeAnswer(text, field);

  // Respuesta inválida — repregunta
  if (!valid) {
    await sendWhatsAppText(patient.phone, `${hint}\n\n${field.question}`);
    return { ok: true, retry: true };
  }

  // Construir el dato a guardar en este paso
  const fieldData: Record<string, string | null> = {
    vomitos:          field.key === "vomitos"           ? value : undefined as unknown as null,
    diarrea:          field.key === "diarrea"           ? value : undefined as unknown as null,
    fiebre:           field.key === "fiebre"            ? value : undefined as unknown as null,
    numeroCrisis:     field.key === "numeroCrisis"      ? value : undefined as unknown as null,
    transgresionDieta:field.key === "transgresionDieta" ? value : undefined as unknown as null,
    cambioFae:        field.key === "cambioFae"         ? value : undefined as unknown as null,
    glucosa:          field.key === "glucosa"           ? value : undefined as unknown as null,
    cetonas:          field.key === "cetonas"           ? value : undefined as unknown as null,
    estadoAnimo:      field.key === "estadoAnimo"       ? value : undefined as unknown as null,
    peso:             field.key === "peso"              ? value : undefined as unknown as null,
    observaciones:    field.key === "observaciones"     ? value : undefined as unknown as null,
  };

  // Limpiar undefined
  const cleanData = Object.fromEntries(
    Object.entries(fieldData).filter(([, v]) => v !== undefined),
  ) as Record<string, string | null>;

  const upcoming = nextField(field.id, survey.slot);

  // Última pregunta — encuesta completa
  if (!upcoming) {
    await prisma.survey.update({
      where: { id: survey.id },
      data: {
        ...cleanData,
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });
    await sendWhatsAppText(
      patient.phone,
      "¡Gracias! ✅ Registramos toda la información en su hoja de vida para el equipo de nutrición de Helse Colombia. Si presenta una urgencia, contacte a su médico o a servicios de emergencia.",
    );
    return { completed: true };
  }

  // Guardar respuesta y avanzar al siguiente paso
  await prisma.survey.update({
    where: { id: survey.id },
    data: {
      ...cleanData,
      currentStep: upcoming.id,
      status: "IN_PROGRESS",
    },
  });

  await sendQuestion(patient.phone, upcoming);
  return { ok: true, next: upcoming.id };
}

/* ------------------------------------------------------------------ */
/* Helper: envía la pregunta correcta según el tipo de campo            */
/* ------------------------------------------------------------------ */
async function sendQuestion(phone: string, field: ReturnType<typeof fieldById>) {
  if (field.type === "yesno") {
    return sendWhatsAppYesNo(phone, field.question);
  }
  if (field.type === "mood") {
    return sendWhatsAppMood(phone, field.question);
  }
  // number y text — mensaje de texto plano
  return sendWhatsAppText(phone, field.question);
}
