"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isSuperadmin, requireSession } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

export async function listUsers() {
  const session = await requireSession();
  if (!isSuperadmin(session.role)) throw new Error("Solo superadmin");
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
  });
}

export async function createUser(formData: FormData) {
  const session = await requireSession();
  if (!isSuperadmin(session.role)) throw new Error("Solo superadmin");

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "NUTRICIONISTA");
  const password = String(formData.get("password") ?? "");
  if (!email || !name || password.length < 8) {
    throw new Error("Nombre, correo y contraseña de 8+ caracteres son obligatorios.");
  }

  const created = await prisma.user.create({
    data: {
      email,
      name,
      role,
      passwordHash: await bcrypt.hash(password, 12),
    },
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
