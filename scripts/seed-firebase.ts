import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();
db.settings({ databaseId: "default", ignoreUndefinedProperties: true });

async function main() {
  console.log("Iniciando seed en Firebase...");

  // Superadmin
  const superHash = await bcrypt.hash("HelseAdmin123!", 12);
  const superRef = db.collection("users").doc();
  await superRef.set({
    email:        "jose@helsecolombia.com",
    name:         "Jose Superadmin",
    role:         "SUPERADMIN",
    passwordHash: superHash,
    active:       true,
    createdAt:    FieldValue.serverTimestamp(),
    updatedAt:    FieldValue.serverTimestamp(),
  });
  console.log("✓ Superadmin creado:", superRef.id);

  // Nutricionista
  const nutriHash = await bcrypt.hash("Nutri1234!", 12);
  const nutriRef = db.collection("users").doc();
  await nutriRef.set({
    email:        "nutricion@helsecolombia.com",
    name:         "Nutricionista PAP",
    role:         "NUTRICIONISTA",
    passwordHash: nutriHash,
    active:       true,
    createdAt:    FieldValue.serverTimestamp(),
    updatedAt:    FieldValue.serverTimestamp(),
  });
  console.log("✓ Nutricionista creado:", nutriRef.id);

  // Paciente demo
  const patientRef = db.collection("patients").doc();
  await patientRef.set({
    documentId:      "1000000001",
    firstName:       "Ana",
    lastName:        "Paciente Demo",
    phone:           "573000000001",
    caregiverName:   "Luis Acudiente",
    caregiverPhone:  "573000000002",
    diagnosis:       "Epilepsia refractaria — dieta cetogénica Ketolance",
    mipresStatus:    "Formulado",
    ketolanceActive: true,
    active:          true,
    surveyToken:     patientRef.id,
    consentAt:       FieldValue.serverTimestamp(),
    createdAt:       FieldValue.serverTimestamp(),
    updatedAt:       FieldValue.serverTimestamp(),
  });
  console.log("✓ Paciente demo creado:", patientRef.id);

  // Asignación nutricionista → paciente
  const assignId = `${nutriRef.id}_${patientRef.id}`;
  await db.collection("assignments").doc(assignId).set({
    userId:    nutriRef.id,
    patientId: patientRef.id,
    createdAt: FieldValue.serverTimestamp(),
  });
  console.log("✓ Asignación creada");

  console.log("\n✅ Seed completado.");
  console.log("Superadmin: jose@helsecolombia.com / HelseAdmin123!");
  console.log("Nutricionista: nutricion@helsecolombia.com / Nutri1234!");
  console.log("Paciente demo documento: 1000000001");
}

main().catch((e) => { console.error(e); process.exit(1); });
