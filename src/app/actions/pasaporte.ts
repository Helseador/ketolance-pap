"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

export async function getPasaporte(patientId: string) {
  await requireSession();
  return prisma.pasaporte.findUnique({ where: { patientId } });
}

export async function savePasaporte(formData: FormData) {
  await requireSession();
  const patientId = String(formData.get("patientId") ?? "");
  if (!patientId) throw new Error("patientId requerido");

  const data = {
    birthDate:         String(formData.get("birthDate") ?? "") || null,
    bloodType:         String(formData.get("bloodType") ?? "") || null,
    emergencyName:     String(formData.get("emergencyName") ?? "") || null,
    emergencyPhone:    String(formData.get("emergencyPhone") ?? "") || null,
    neurologistName:   String(formData.get("neurologistName") ?? "") || null,
    neurologistPhone:  String(formData.get("neurologistPhone") ?? "") || null,
    nutritionistName:  String(formData.get("nutritionistName") ?? "") || null,
    nutritionistPhone: String(formData.get("nutritionistPhone") ?? "") || null,
    anticonvulsants:   String(formData.get("anticonvulsants") ?? "") || null,
    supplements:       String(formData.get("supplements") ?? "") || null,
    allergies:         String(formData.get("allergies") ?? "") || null,
    dietType:          String(formData.get("dietType") ?? "") || null,
    ketogenicRatio:    String(formData.get("ketogenicRatio") ?? "") || null,
    ketogenicFormula:  String(formData.get("ketogenicFormula") ?? "") || null,
    dietRestrictions:  String(formData.get("dietRestrictions") ?? "") || null,
    maxDailyGlucose:   String(formData.get("maxDailyGlucose") ?? "") || null,
    contactPhone:      String(formData.get("contactPhone") ?? "") || null,
    contactEmail:      String(formData.get("contactEmail") ?? "") || null,
    medicalNotes:      String(formData.get("medicalNotes") ?? "") || null,
  };

  await prisma.pasaporte.upsert({
    where: { patientId },
    update: data,
    create: { patientId, ...data },
  });

  revalidatePath(`/dashboard/pacientes/${patientId}/pasaporte`);
}

/**
 * Versión pública para el paciente — solo hojas 4, 5 y 6.
 * Valida que el patientId corresponda a un paciente activo.
 * NO requiere sesión del dashboard.
 */
export async function savePasaportePublico(formData: FormData) {
  const patientId = String(formData.get("patientId") ?? "");
  if (!patientId) throw new Error("patientId requerido");

  // Verificar que el paciente existe y está activo
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, active: true },
    select: { id: true },
  });
  if (!patient) throw new Error("Paciente no encontrado");

  // Solo campos de hojas 4, 5 y 6 — no instrucciones médicas (hoja 7)
  const data = {
    birthDate:         String(formData.get("birthDate") ?? "") || null,
    bloodType:         String(formData.get("bloodType") ?? "") || null,
    emergencyName:     String(formData.get("emergencyName") ?? "") || null,
    emergencyPhone:    String(formData.get("emergencyPhone") ?? "") || null,
    neurologistName:   String(formData.get("neurologistName") ?? "") || null,
    neurologistPhone:  String(formData.get("neurologistPhone") ?? "") || null,
    nutritionistName:  String(formData.get("nutritionistName") ?? "") || null,
    nutritionistPhone: String(formData.get("nutritionistPhone") ?? "") || null,
    anticonvulsants:   String(formData.get("anticonvulsants") ?? "") || null,
    supplements:       String(formData.get("supplements") ?? "") || null,
    allergies:         String(formData.get("allergies") ?? "") || null,
    dietType:          String(formData.get("dietType") ?? "") || null,
    ketogenicRatio:    String(formData.get("ketogenicRatio") ?? "") || null,
    ketogenicFormula:  String(formData.get("ketogenicFormula") ?? "") || null,
    dietRestrictions:  String(formData.get("dietRestrictions") ?? "") || null,
  };

  await prisma.pasaporte.upsert({
    where: { patientId },
    update: data,
    create: { patientId, ...data },
  });

  revalidatePath(`/dashboard/pacientes/${patientId}/pasaporte`);
}
