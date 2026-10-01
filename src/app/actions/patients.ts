"use server";

import { revalidatePath } from "next/cache";
import { canSeeAllPatients, isSuperadmin, requireSession } from "@/lib/auth";
import { writeAudit } from "@/lib/db/audit";
import {
  listPatients,
  findPatientById,
  createPatient,
  updatePatient,
  getAssignedPatientIds,
} from "@/lib/db/patients";
import { listSurveysByPatient } from "@/lib/db/surveys";
import { findPasaporte } from "@/lib/db/pasaportes";
import { newId } from "@/lib/firebase";

export async function listPatientsAction() {
  const session = await requireSession();
  let ids: string[] | undefined;

  if (!canSeeAllPatients(session.role)) {
    ids = await getAssignedPatientIds(session.id);
  }

  return listPatients(ids);
}

export async function getPatient(id: string) {
  const session = await requireSession();

  if (!canSeeAllPatients(session.role)) {
    const ids = await getAssignedPatientIds(session.id);
    if (!ids.includes(id)) throw new Error("Sin acceso a este paciente");
  }

  const [patient, surveys] = await Promise.all([
    findPatientById(id),
    listSurveysByPatient(id),
  ]);

  if (!patient) throw new Error("Paciente no encontrado");
  return { ...patient, surveys };
}

export async function upsertPatient(formData: FormData) {
  const session = await requireSession();
  if (session.role === "NUTRICIONISTA") {
    throw new Error("El nutricionista no crea pacientes; solicítelo a empresa o superadmin.");
  }

  const id = String(formData.get("id") ?? "").trim();
  const str = (k: string) => String(formData.get(k) ?? "").trim() || null;

  const data = {
    documentId:     String(formData.get("documentId") ?? "").trim(),
    firstName:      String(formData.get("firstName") ?? "").trim(),
    lastName:       String(formData.get("lastName") ?? "").trim(),
    phone:          String(formData.get("phone") ?? "").replace(/\s/g, ""),
    caregiverName:  str("caregiverName"),
    caregiverPhone: str("caregiverPhone"),
    diagnosis:      str("diagnosis"),
    mipresStatus:   str("mipresStatus"),
    notes:          str("notes"),
    active:         formData.get("active") === "on",
    ketolanceActive:formData.get("ketolanceActive") === "on",
    consentAt:      formData.get("consent") === "on" ? new Date() : null,
  };

  if (!data.documentId || !data.firstName || !data.lastName || !data.phone) {
    throw new Error("Documento, nombre, apellido y celular son obligatorios.");
  }

  if (id) {
    const before = await findPatientById(id);
    const after = await updatePatient(id, data);
    await writeAudit({
      actor: session,
      action: "UPDATE",
      entityType: "Patient",
      entityId: id,
      before,
      after,
    });
    revalidatePath("/dashboard/pacientes");
    revalidatePath(`/dashboard/pacientes/${id}`);
    return after;
  }

  const created = await createPatient({
    ...data,
    surveyToken: newId(),
    consentAt: data.consentAt,
  });

  await writeAudit({
    actor: session,
    action: "CREATE",
    entityType: "Patient",
    entityId: created.id,
    after: created,
  });

  revalidatePath("/dashboard/pacientes");
  return created;
}

export async function upsertPatientAction(formData: FormData) {
  await upsertPatient(formData);
}
