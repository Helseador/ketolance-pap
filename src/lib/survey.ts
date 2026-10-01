import { bogotaParts, slotForHour, type SlotKey } from "./time";
import { fieldsForSlot, firstField, nextField, fieldById, normalizeAnswer } from "./survey-copy";
import { sendWhatsAppText, sendWhatsAppYesNo, sendWhatsAppMood } from "./whatsapp";
import {
  findSurveyBySlot,
  findActiveSurvey,
  createSurvey,
  updateSurvey,
  type Survey,
} from "@/lib/db/surveys";
import { listActiveKetolance, findPatientByPhone } from "@/lib/db/patients";

/* ------------------------------------------------------------------ */
/* Dispatch                                                              */
/* ------------------------------------------------------------------ */
export async function dispatchDueSurveys(forceSlot?: SlotKey) {
  const parts = bogotaParts();
  const slot = forceSlot ?? slotForHour(parts.hour);
  if (!slot) {
    return { skipped: true, reason: "Fuera de horario 8:00 / 12:00 / 16:00", date: parts.date };
  }

  const patients = await listActiveKetolance();
  const results: { patientId: string; status: string; error?: string }[] = [];

  for (const patient of patients) {
    try {
      const existing = await findSurveyBySlot(patient.id, parts.date, slot);
      if (existing) {
        results.push({ patientId: patient.id, status: "already_exists" });
        continue;
      }

      const first = firstField(slot);
      const survey = await createSurvey({
        patientId:         patient.id,
        slot,
        localDate:         parts.date,
        status:            "IN_PROGRESS",
        currentStep:       first.id,
        sentAt:            null,
        completedAt:       null,
        vomitos:           null,
        diarrea:           null,
        fiebre:            null,
        temperaturaFiebre: null,
        numeroCrisis:      null,
        transgresionDieta: null,
        cambioFae:         null,
        glucosa:           null,
        cetonas:           null,
        estadoAnimo:       null,
        peso:              null,
        observaciones:     null,
        lastWhatsappId:    null,
        errorMessage:      null,
      });

      const sent = await sendQuestion(patient.phone, first);
      await updateSurvey(survey.id, {
        sentAt: new Date(),
        lastWhatsappId: sent.id ?? null,
      });

      results.push({ patientId: patient.id, status: sent.dryRun ? "dry_run" : "sent" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error";
      results.push({ patientId: patient.id, status: "failed", error: message });
    }
  }

  return { skipped: false, date: parts.date, slot, results };
}

/* ------------------------------------------------------------------ */
/* Manejo de respuestas WhatsApp                                         */
/* ------------------------------------------------------------------ */
export async function handleIncomingWhatsApp(from: string, text: string) {
  const patient = await findPatientByPhone(from);

  if (!patient) {
    await sendWhatsAppText(
      from,
      "Este número no está registrado en el Programa de Apoyo a Pacientes de Helse Colombia. Si cree que es un error, comuníquese con su nutricionista.",
    );
    return { ignored: true };
  }

  const survey = await findActiveSurvey(patient.id);

  if (!survey) {
    await sendWhatsAppText(
      patient.phone,
      "Gracias 😊 En este momento no hay una encuesta activa. Le escribiremos en el próximo turno (8:00, 12:00 o 16:00).",
    );
    return { ignored: true };
  }

  const field = fieldById(survey.currentStep);
  const { value, valid, hint } = normalizeAnswer(text, field);

  if (!valid) {
    await sendWhatsAppText(patient.phone, `${hint}\n\n${field.question}`);
    return { ok: true, retry: true };
  }

  const fieldData: Partial<Survey> = {
    [field.key]: value,
  };

  const upcoming = nextField(field.id, survey.slot);

  if (!upcoming) {
    await updateSurvey(survey.id, {
      ...fieldData,
      status: "COMPLETED",
      completedAt: new Date(),
    });
    await sendWhatsAppText(
      patient.phone,
      "¡Gracias! ✅ Registramos toda la información en su hoja de vida para el equipo de nutrición de Helse Colombia. Si presenta una urgencia, contacte a su médico o a servicios de emergencia.",
    );
    return { completed: true };
  }

  await updateSurvey(survey.id, {
    ...fieldData,
    currentStep: upcoming.id,
    status: "IN_PROGRESS",
  });

  await sendQuestion(patient.phone, upcoming);
  return { ok: true, next: upcoming.id };
}

/* ------------------------------------------------------------------ */
/* Helper                                                                */
/* ------------------------------------------------------------------ */
async function sendQuestion(phone: string, field: ReturnType<typeof fieldById>) {
  if (field.type === "yesno") return sendWhatsAppYesNo(phone, field.question);
  if (field.type === "mood")  return sendWhatsAppMood(phone, field.question);
  return sendWhatsAppText(phone, field.question);
}
