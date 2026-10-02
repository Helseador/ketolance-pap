import { db, COL, toDate } from "@/lib/firebase";
import { FieldValue, type DocumentData } from "firebase-admin/firestore";

export type Pasaporte = {
  id: string;
  patientId: string;
  birthDate: string | null;
  bloodType: string | null;
  emergencyName: string | null;
  emergencyPhone: string | null;
  neurologistName: string | null;
  neurologistPhone: string | null;
  nutritionistName: string | null;
  nutritionistPhone: string | null;
  photoUrl: string | null;
  anticonvulsants: string | null;
  supplements: string | null;
  allergies: string | null;
  dietType: string | null;
  ketogenicRatio: string | null;
  ketogenicFormula: string | null;
  dietRestrictions: string | null;
  maxDailyGlucose: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  medicalNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function docToPasaporte(id: string, data: DocumentData): Pasaporte {
  return {
    id,
    patientId:         data.patientId,
    birthDate:         data.birthDate ?? null,
    bloodType:         data.bloodType ?? null,
    emergencyName:     data.emergencyName ?? null,
    emergencyPhone:    data.emergencyPhone ?? null,
    neurologistName:   data.neurologistName ?? null,
    neurologistPhone:  data.neurologistPhone ?? null,
    nutritionistName:  data.nutritionistName ?? null,
    nutritionistPhone: data.nutritionistPhone ?? null,
    photoUrl:          data.photoUrl ?? null,
    anticonvulsants:   data.anticonvulsants ?? null,
    supplements:       data.supplements ?? null,
    allergies:         data.allergies ?? null,
    dietType:          data.dietType ?? null,
    ketogenicRatio:    data.ketogenicRatio ?? null,
    ketogenicFormula:  data.ketogenicFormula ?? null,
    dietRestrictions:  data.dietRestrictions ?? null,
    maxDailyGlucose:   data.maxDailyGlucose ?? null,
    contactPhone:      data.contactPhone ?? null,
    contactEmail:      data.contactEmail ?? null,
    medicalNotes:      data.medicalNotes ?? null,
    createdAt:         toDate(data.createdAt) ?? new Date(),
    updatedAt:         toDate(data.updatedAt) ?? new Date(),
  };
}

export async function findPasaporte(patientId: string): Promise<Pasaporte | null> {
  const snap = await db.collection(COL.PASAPORTES)
    .where("patientId", "==", patientId).limit(1).get();
  if (snap.empty) return null;
  return docToPasaporte(snap.docs[0].id, snap.docs[0].data());
}

export async function upsertPasaporte(
  patientId: string,
  data: Partial<Omit<Pasaporte, "id" | "patientId" | "createdAt" | "updatedAt">>
): Promise<void> {
  const existing = await findPasaporte(patientId);
  const now = FieldValue.serverTimestamp();

  if (existing) {
    await db.collection(COL.PASAPORTES).doc(existing.id).update({
      ...data,
      updatedAt: now,
    });
  } else {
    const ref = db.collection(COL.PASAPORTES).doc();
    await ref.set({
      patientId,
      ...data,
      createdAt: now,
      updatedAt: now,
    });
  }
}
