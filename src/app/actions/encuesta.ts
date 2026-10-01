"use server";

import { bogotaParts, slotForHour } from "@/lib/time";
import { findPatientByToken, findPatientByDocument } from "@/lib/db/patients";
import { findSurveyBySlot, createSurvey, updateSurvey, listSurveysByPatient, listSurveysByMonth } from "@/lib/db/surveys";
import { findPasaporte } from "@/lib/db/pasaportes";

export async function getPatientByToken(token: string) {
  return findPatientByToken(token);
}

export async function loginByDocument(documentId: string) {
  const patient = await findPatientByDocument(documentId);
  if (!patient) return null;

  const { date } = bogotaParts();
  const month = date.slice(0, 7);

  const surveys = await listSurveysByMonth(patient.id, month);
  const completed = surveys.filter((s) => s.status === "COMPLETED").length;
  const total = surveys.length;

  const todaySurveys = surveys.filter((s) => s.localDate === date);
  const slots = ["MANANA", "MEDIODIA", "TARDE"];
  const nextSlot = slots.find(
    (sl) => !todaySurveys.find((s) => s.slot === sl && s.status === "COMPLETED"),
  ) ?? null;

  const lastCompleted = surveys.find((s) => s.status === "COMPLETED");

  return {
    id:              patient.id,
    firstName:       patient.firstName,
    lastName:        patient.lastName,
    surveyToken:     patient.surveyToken,
    diagnosis:       patient.diagnosis,
    ketolanceActive: patient.ketolanceActive,
    stats:           { completed, total, month },
    nextSlot,
    lastSurveyDate:  lastCompleted?.localDate ?? null,
  };
}

export async function getPasaporteByPatientId(patientId: string) {
  const [pasaporte, surveys] = await Promise.all([
    findPasaporte(patientId),
    listSurveysByPatient(patientId),
  ]);
  return { pasaporte, surveys };
}

export async function submitEncuesta(formData: FormData) {
  const token       = String(formData.get("token") ?? "");
  const slotOverride = String(formData.get("slotOverride") ?? "") as "MANANA" | "MEDIODIA" | "TARDE" | "";

  const patient = await findPatientByToken(token);
  if (!patient) throw new Error("Paciente no encontrado");

  const { date, hour } = bogotaParts();
  const slot = slotOverride || slotForHour(hour) || (hour < 12 ? "MANANA" : hour < 16 ? "MEDIODIA" : "TARDE");

  const str = (k: string) => String(formData.get(k) ?? "").trim() || null;

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

  const existing = await findSurveyBySlot(patient.id, date, slot);

  if (existing) {
    await updateSurvey(existing.id, data);
  } else {
    await createSurvey({
      patientId:         patient.id,
      slot,
      localDate:         date,
      currentStep:       "VOMITOS",
      sentAt:            new Date(),
      lastWhatsappId:    null,
      errorMessage:      null,
      vomitos:           data.vomitos,
      diarrea:           data.diarrea,
      fiebre:            data.fiebre,
      temperaturaFiebre: data.temperaturaFiebre,
      numeroCrisis:      data.numeroCrisis,
      transgresionDieta: data.transgresionDieta,
      cambioFae:         data.cambioFae,
      glucosa:           data.glucosa,
      cetonas:           data.cetonas,
      estadoAnimo:       data.estadoAnimo,
      peso:              data.peso,
      observaciones:     data.observaciones,
      status:            data.status,
      completedAt:       data.completedAt,
    });
  }

  return { ok: true, patientName: `${patient.firstName} ${patient.lastName}` };
}
