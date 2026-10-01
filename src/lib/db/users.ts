import { db, COL, newId, toDate } from "@/lib/firebase";
import { FieldValue } from "firebase-admin/firestore";

export type UserRole = "SUPERADMIN" | "EMPRESA" | "NUTRICIONISTA";

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function docToUser(id: string, data: FirebaseFirestore.DocumentData): User {
  return {
    id,
    email:        data.email,
    passwordHash: data.passwordHash,
    name:         data.name,
    role:         data.role,
    active:       data.active ?? true,
    createdAt:    toDate(data.createdAt) ?? new Date(),
    updatedAt:    toDate(data.updatedAt) ?? new Date(),
  };
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const snap = await db.collection(COL.USERS)
    .where("email", "==", email.trim().toLowerCase())
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return docToUser(doc.id, doc.data());
}

export async function findUserById(id: string): Promise<User | null> {
  const doc = await db.collection(COL.USERS).doc(id).get();
  if (!doc.exists) return null;
  return docToUser(doc.id, doc.data()!);
}

export async function listUsers(): Promise<Omit<User, "passwordHash">[]> {
  const snap = await db.collection(COL.USERS)
    .orderBy("createdAt", "desc")
    .get();
  return snap.docs.map((d) => {
    const u = docToUser(d.id, d.data());
    const { passwordHash: _, ...rest } = u;
    return rest;
  });
}

export async function createUser(data: {
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string;
}): Promise<User> {
  const id = newId();
  const now = FieldValue.serverTimestamp();
  await db.collection(COL.USERS).doc(id).set({
    ...data,
    email: data.email.trim().toLowerCase(),
    active: true,
    createdAt: now,
    updatedAt: now,
  });
  return findUserById(id) as Promise<User>;
}

export async function updateUser(id: string, data: Partial<User>) {
  await db.collection(COL.USERS).doc(id).update({
    ...data,
    updatedAt: FieldValue.serverTimestamp(),
  });
}
