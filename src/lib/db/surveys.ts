import { db, COL, newId, toDate } from "@/lib/firebase";
import { FieldValue } from "firebase-admin/firestore";

export type Survey = {
  id: string;
  patientId: string;
  slot: string;
  localDate: string;
  status: string;
  currentStep: string;
  sentAt: Date | null;
  completedAt: Date | null;
  // Síntomas numéricos
  vomitos: string | null;
  diarrea: string | null;
  fiebre: string | null;
  temperaturaFiebre: string | null;
  numeroCrisis: string | null;
  // Sí/No
  transgresionDieta: string | null;
  cambioFae: string | null;
  // Clínicos
  glucosa: string | null;
  cetonas: string | null;
  estadoAnimo: string | null;
  peso: string | null;
  observaciones: string | null;
  lastWhatsappId: string | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function docToSurvey(id: string, data: FirebaseFirestore.DocumentData): Survey {
  return {
    id,
    patientId:         data.patientId,
    slot:              data.slot,
    localDate:         data.localDate,
    status:            data.status ?? "PENDING",
    currentStep:       data.currentStep ?? "VOMITOS",
    sentAt:            toDate(data.sentAt),
    completedAt:       toDate(data.completedAt),
    vomitos:           data.vomitos ?? null,
    diarrea:           data.diarrea ?? null,
    fiebre:            data.fiebre ?? null,
    temperaturaFiebre: data.temperaturaFiebre ?? null,
    numeroCrisis:      data.numeroCrisis ?? null,
    transgresionDieta: data.transgresionDieta ?? null,
    cambioFae:         data.cambioFae ?? null,
    glucosa:           data.glucosa ?? null,
    cetonas:           data.cetonas ?? null,
    estadoAnimo:       data.estadoAnimo ?? null,
    peso:              data.peso ?? null,
    observaciones:     data.observaciones ?? null,
    lastWhatsappId:    data.lastWhatsappId ?? null,
    errorMessage:      data.errorMessage ?? null,
    createdAt:         toDate(data.createdAt) ?? new Date(),
    updatedAt:         toDate(data.updatedAt) ?? new Date(),
  };
}

export async function findSurveyBySlot(patientId: string, localDate: string, slot: string): Promise<Survey | null> {
  const snap = await db.collection(COL.SURVEYS)
    .where("patientId", "==", patientId)
    .where("localDate", "==", localDate)
    .where("slot", "==", slot)
    .limit(1).get();
  if (snap.empty) return null;
  return docToSurvey(snap.docs[0].id, snap.docs[0].data());
}

export async function findActiveSurvey(patientId: string): Promise<Survey | null> {
  const snap = await db.collection(COL.SURVEYS)
    .where("patientId", "==", patientId)
    .where("status", "in", ["PENDING", "IN_PROGRESS"])
    .orderBy("createdAt", "desc")
    .limit(1).get();
  if (snap.empty) return null;
  return docToSurvey(snap.docs[0].id, snap.docs[0].data());
}

export async function listSurveysByDate(localDate: string): Promise<Survey[]> {
  const snap = await db.collection(COL.SURVEYS)
    .where("localDate", "==", localDate)
    .orderBy("slot").get();
  return snap.docs.map((d) => docToSurvey(d.id, d.data()));
}

export async function listSurveysByPatient(patientId: string): Promise<Survey[]> {
  const snap = await db.collection(COL.SURVEYS)
    .where("patientId", "==", patientId)
    .orderBy("localDate", "desc")
    .orderBy("slot").get();
  return snap.docs.map((d) => docToSurvey(d.id, d.data()));
}

export async function listSurveysByMonth(patientId: string, month: string): Promise<Survey[]> {
  // month = YYYY-MM
  const snap = await db.collection(COL.SURVEYS)
    .where("patientId", "==", patientId)
    .where("localDate", ">=", `${month}-01`)
    .where("localDate", "<=", `${month}-31`)
    .orderBy("localDate").get();
  return snap.docs.map((d) => docToSurvey(d.id, d.data()));
}

export async function findSurveyById(id: string): Promise<Survey | null> {
  const doc = await db.collection(COL.SURVEYS).doc(id).get();
  if (!doc.exists) return null;
  return docToSurvey(doc.id, doc.data()!);
}

export async function createSurvey(data: Omit<Survey, "id" | "createdAt" | "updatedAt">): Promise<Survey> {
  const id = newId();
  const now = FieldValue.serverTimestamp();
  await db.collection(COL.SURVEYS).doc(id).set({
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return findSurveyById(id) as Promise<Survey>;
}

export async function updateSurvey(id: string, data: Partial<Survey>): Promise<Survey> {
  await db.collection(COL.SURVEYS).doc(id).update({
    ...data,
    updatedAt: FieldValue.serverTimestamp(),
  });
  return findSurveyById(id) as Promise<Survey>;
}
