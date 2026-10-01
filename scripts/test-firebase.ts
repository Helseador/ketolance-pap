import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
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

async function main() {
  console.log("Project ID:", process.env.FIREBASE_PROJECT_ID);
  console.log("Client Email:", process.env.FIREBASE_CLIENT_EMAIL);
  console.log("Private Key existe:", !!process.env.FIREBASE_PRIVATE_KEY);

  try {
    const db = getFirestore();
    db.settings({ databaseId: "default", ignoreUndefinedProperties: true });
    // Intenta leer cualquier colección
    const snap = await db.collection("test").limit(1).get();
    console.log("✅ Conexión exitosa! Docs:", snap.size);

    // Escribe un documento de prueba
    await db.collection("test").doc("ping").set({ ok: true, ts: new Date() });
    console.log("✅ Escritura exitosa!");

    // Limpia
    await db.collection("test").doc("ping").delete();
    console.log("✅ Todo funciona correctamente.");
  } catch (e) {
    console.error("❌ Error:", e);
  }
}

main();
