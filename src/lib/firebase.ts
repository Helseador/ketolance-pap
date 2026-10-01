import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function initFirebase() {
  if (getApps().length > 0) return;

  initializeApp({
    credential: cert({
      projectId:    process.env.FIREBASE_PROJECT_ID,
      clientEmail:  process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:   process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });

  const firestore = getFirestore();
  firestore.settings({ databaseId: "default", ignoreUndefinedProperties: true });
}

initFirebase();

export const db = getFirestore();

/* ------------------------------------------------------------------ */
/* Nombres de colecciones                                               */
/* ------------------------------------------------------------------ */
export const COL = {
  USERS:        "users",
  PATIENTS:     "patients",
  ASSIGNMENTS:  "assignments",   // userId_patientId
  SURVEYS:      "surveys",
  PASAPORTES:   "pasaportes",
  AUDIT:        "auditLogs",
} as const;

/* ------------------------------------------------------------------ */
/* Helper — convierte Timestamp de Firestore a Date                     */
/* ------------------------------------------------------------------ */
export function toDate(val: unknown): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  // Firestore Timestamp
  if (typeof val === "object" && "toDate" in (val as object)) {
    return (val as { toDate: () => Date }).toDate();
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Helper — genera ID único                                             */
/* ------------------------------------------------------------------ */
export function newId(): string {
  return db.collection("_").doc().id;
}
