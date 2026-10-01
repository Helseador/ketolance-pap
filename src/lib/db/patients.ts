import { db, COL, newId, toDate } from "@/lib/firebase";
import { FieldValue } from "firebase-admin/firestore";

export type Patient = {
  id: string;
  documentId: string;
  firstName: string;
  lastName: string;
  phone: string;
  caregiverName: string | null;
  caregiverPhone: string | null;
  diagnosis: string | null;
  mipresStatus: string | null;
  notes: string | null;
  consentAt: Date | null;
  ketolanceActive: boolean;
  active: boolean;
  surveyToken: string;
  createdAt: Date;
  updatedAt: Date;
};

function docToPatient(id: string, data: FirebaseFirestore.DocumentData): Patient {
  return {
    id,
    documentId:     data.documentId,
    firstName:      data.firstName,
    lastName:       data.lastName,
    phone:          data.phone,
    caregiverName:  data.caregiverName ?? null,
    caregiverPhone: data.caregiverPhone ?? null,
    diagnosis:      data.diagnosis ?? null,
    mipresStatus:   data.mipresStatus ?? null,
    notes:          data.notes ?? null,
    consentAt:      toDate(data.consentAt),
    ketolanceActive:data.ketolanceActive ?? true,
    active:         data.active ?? true,
    surveyToken:    data.surveyToken ?? id,
    createdAt:      toDate(data.createdAt) ?? new Date(),
    updatedAt:      toDate(data.updatedAt) ?? new Date(),
  };
}

export async function listPatients(ids?: string[]): Promise<Patient[]> {
  let query: FirebaseFirestore.Query = db.collection(COL.PATIENTS)
    .where("active", "==", true)
    .orderBy("lastName");

  const snap = await query.get();
  let patients = snap.docs.map((d) => docToPatient(d.id, d.data()));

  if (ids) patients = patients.filter((p) => ids.includes(p.id));
  return patients;
}

export async function findPatientById(id: string): Promise<Patient | null> {
  const doc = await db.collection(COL.PATIENTS).doc(id).get();
  if (!doc.exists) return null;
  return docToPatient(doc.id, doc.data()!);
}

export async function findPatientByDocument(documentId: string): Promise<Patient | null> {
  const snap = await db.collection(COL.PATIENTS)
    .where("documentId", "==", documentId.trim())
    .limit(1).get();
  if (snap.empty) return null;
  return docToPatient(snap.docs[0].id, snap.docs[0].data());
}

export async function findPatientByToken(token: string): Promise<Patient | null> {
  const snap = await db.collection(COL.PATIENTS)
    .where("surveyToken", "==", token)
    .where("active", "==", true)
    .limit(1).get();
  if (snap.empty) return null;
  return docToPatient(snap.docs[0].id, snap.docs[0].data());
}

export async function findPatientByPhone(phone: string): Promise<Patient | null> {
  const clean = phone.replace(/\D/g, "");
  // Busca por phone o caregiverPhone
  const [s1, s2] = await Promise.all([
    db.collection(COL.PATIENTS).where("phone", "==", clean).limit(1).get(),
    db.collection(COL.PATIENTS).where("caregiverPhone", "==", clean).limit(1).get(),
  ]);
  const doc = s1.docs[0] ?? s2.docs[0];
  if (!doc) return null;
  return docToPatient(doc.id, doc.data());
}

export async function listActiveKetolance(): Promise<Patient[]> {
  const snap = await db.collection(COL.PATIENTS)
    .where("active", "==", true)
    .where("ketolanceActive", "==", true)
    .get();
  return snap.docs.map((d) => docToPatient(d.id, d.data()));
}

export async function createPatient(data: Omit<Patient, "id" | "createdAt" | "updatedAt">): Promise<Patient> {
  const id = newId();
  const now = FieldValue.serverTimestamp();
  await db.collection(COL.PATIENTS).doc(id).set({
    ...data,
    surveyToken: data.surveyToken || id,
    createdAt: now,
    updatedAt: now,
  });
  return findPatientById(id) as Promise<Patient>;
}

export async function updatePatient(id: string, data: Partial<Patient>): Promise<Patient> {
  await db.collection(COL.PATIENTS).doc(id).update({
    ...data,
    updatedAt: FieldValue.serverTimestamp(),
  });
  return findPatientById(id) as Promise<Patient>;
}

/* Asignaciones nutricionista ↔ paciente */
export async function getAssignedPatientIds(userId: string): Promise<string[]> {
  const snap = await db.collection(COL.ASSIGNMENTS)
    .where("userId", "==", userId).get();
  return snap.docs.map((d) => d.data().patientId as string);
}

export async function assignPatient(userId: string, patientId: string) {
  const id = `${userId}_${patientId}`;
  await db.collection(COL.ASSIGNMENTS).doc(id).set({
    userId, patientId, createdAt: FieldValue.serverTimestamp(),
  });
}
