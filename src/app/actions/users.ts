"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { isSuperadmin, requireSession } from "@/lib/auth";
import { writeAudit } from "@/lib/db/audit";
import { listUsers, createUser } from "@/lib/db/users";

export async function listUsersAction() {
  const session = await requireSession();
  if (!isSuperadmin(session.role)) throw new Error("Solo superadmin");
  return listUsers();
}

export async function createUserAction(formData: FormData) {
  const session = await requireSession();
  if (!isSuperadmin(session.role)) throw new Error("Solo superadmin");

  const email    = String(formData.get("email") ?? "").trim().toLowerCase();
  const name     = String(formData.get("name") ?? "").trim();
  const role     = String(formData.get("role") ?? "NUTRICIONISTA") as "SUPERADMIN" | "EMPRESA" | "NUTRICIONISTA";
  const password = String(formData.get("password") ?? "");

  if (!email || !name || password.length < 8) {
    throw new Error("Nombre, correo y contraseña de 8+ caracteres son obligatorios.");
  }

  const created = await createUser({
    email,
    name,
    role,
    passwordHash: await bcrypt.hash(password, 12),
  });

  await writeAudit({
    actor: session,
    action: "CREATE",
    entityType: "User",
    entityId: created.id,
    after: { email, name, role },
  });

  revalidatePath("/dashboard/usuarios");
}
