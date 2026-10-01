"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { findPasaporte, upsertPasaporte } from "@/lib/db/pasaportes";
import { findPatientById } from "@/lib/db/patients";

export async function getPasaporte(patientId: string) {
  await requireSession();
  return findPasaporte(patientId);
}

function extractPasaporteData(formData: FormData) {
  const str = (k: string) => String(formData.get(k) ?? "") || null;
  return {
    birthDate:         str("birthDate"),
    bloodType:         str("bloodType"),
    emergencyName:     str("emergencyName"),
    emergencyPhone:    str("emergencyPhone"),
    neurologistName:   str("neurologistName"),
    neurologistPhone:  str("neurologistPhone"),
    nutritionistName:  str("nutritionistName"),
    nutritionistPhone: str("nutritionistPhone"),
    anticonvulsants:   str("anticonvulsants"),
    supplements:       str("supplements"),
    allergies:         str("allergies"),
    dietType:          str("dietType"),
    ketogenicRatio:    str("ketogenicRatio"),
    ketogenicFormula:  str("ketogenicFormula"),
    dietRestrictions:  str("dietRestrictions"),
    maxDailyGlucose:   str("maxDailyGlucose"),
    contactPhone:      str("contactPhone"),
    contactEmail:      str("contactEmail"),
    medicalNotes:      str("medicalNotes"),
  };
}

export async function savePasaporte(formData: FormData) {
  await requireSession();
  const patientId = String(formData.get("patientId") ?? "");
  if (!patientId) throw new Error("patientId requerido");
  await upsertPasaporte(patientId, extractPasaporteData(formData));
  revalidatePath(`/dashboard/pacientes/${patientId}/pasaporte`);
}

export async function savePasaportePublico(formData: FormData) {
  const patientId = String(formData.get("patientId") ?? "");
  if (!patientId) throw new Error("patientId requerido");

  const patient = await findPatientById(patientId);
  if (!patient || !patient.active) throw new Error("Paciente no encontrado");

  const str = (k: string) => String(formData.get(k) ?? "") || null;

  // Solo hojas 4, 5 y 6 — sin instrucciones médicas
  await upsertPasaporte(patientId, {
    birthDate:         str("birthDate"),
    bloodType:         str("bloodType"),
    emergencyName:     str("emergencyName"),
    emergencyPhone:    str("emergencyPhone"),
    neurologistName:   str("neurologistName"),
    neurologistPhone:  str("neurologistPhone"),
    nutritionistName:  str("nutritionistName"),
    nutritionistPhone: str("nutritionistPhone"),
    anticonvulsants:   str("anticonvulsants"),
    supplements:       str("supplements"),
    allergies:         str("allergies"),
    dietType:          str("dietType"),
    ketogenicRatio:    str("ketogenicRatio"),
    ketogenicFormula:  str("ketogenicFormula"),
    dietRestrictions:  str("dietRestrictions"),
  });

  revalidatePath(`/dashboard/pacientes/${patientId}/pasaporte`);
}
