"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { canSeeAllPatients, isSuperadmin, requireSession } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

async function visiblePatientIds(userId: string, role: string) {
  if (canSeeAllPatients(role as "SUPERADMIN")) return null;
  const rows = await prisma.patientAssignment.findMany({
    where: { userId },
    select: { patientId: true },
  });
  return rows.map((r) => r.patientId);
}

export async function listPatients() {
  const session = await requireSession();
  const ids = await visiblePatientIds(session.id, session.role);
  return prisma.patient.findMany({
    where: ids ? { id: { in: ids } } : undefined,
    orderBy: { lastName: "asc" },
    include: {
      surveys: {
        orderBy: { createdAt: "desc" },
        take: 3,
      },
    },
  });
}

export async function getPatient(id: string) {
  const session = await requireSession();
  const ids = await visiblePatientIds(session.id, session.role);
  if (ids && !ids.includes(id)) throw new Error("Sin acceso a este paciente");

  return prisma.patient.findUniqueOrThrow({
    where: { id },
    include: {
      surveys: { orderBy: [{ localDate: "desc" }, { slot: "asc" }] },
      assignments: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });
}

export async function upsertPatient(formData: FormData) {
  const session = await requireSession();
  if (session.role === "NUTRICIONISTA") {
    throw new Error("El nutricionista no crea pacientes; solicítelo a empresa o superadmin.");
  }

  const id = String(formData.get("id") ?? "");
  const data = {
    documentId: String(formData.get("documentId") ?? "").trim(),
    firstName: String(formData.get("firstName") ?? "").trim(),
    lastName: String(formData.get("lastName") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").replace(/\s/g, ""),
    caregiverName: String(formData.get("caregiverName") ?? "") || null,
    caregiverPhone: String(formData.get("caregiverPhone") ?? "") || null,
    diagnosis: String(formData.get("diagnosis") ?? "") || null,
    mipresStatus: String(formData.get("mipresStatus") ?? "") || null,
    notes: String(formData.get("notes") ?? "") || null,
    active: formData.get("active") === "on",
    ketolanceActive: formData.get("ketolanceActive") === "on",
    consentAt: formData.get("consent") === "on" ? new Date() : undefined,
  };

  if (!data.documentId || !data.firstName || !data.lastName || !data.phone) {
    throw new Error("Documento, nombre, apellido y celular son obligatorios.");
  }

  if (id) {
    const before = await prisma.patient.findUnique({ where: { id } });
    const after = await prisma.patient.update({ where: { id }, data });
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

  const created = await prisma.patient.create({
    data: {
      ...data,
      consentAt: data.consentAt ?? null,
    },
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

/**
 * Server action para editar un paciente existente desde la hoja de vida
 * (sin redirect — el cliente gestiona el feedback).
 */
export async function upsertPatientAction(formData: FormData) {
  await upsertPatient(formData);
}
