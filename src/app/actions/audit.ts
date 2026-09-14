"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isSuperadmin, requireSession } from "@/lib/auth";
import { revertAudit } from "@/lib/audit";

export async function listAuditLogs() {
  const session = await requireSession();
  if (!isSuperadmin(session.role)) throw new Error("Solo superadmin");
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { actor: { select: { name: true, email: true } } },
  });
}

export async function revertLogAction(formData: FormData) {
  const session = await requireSession();
  if (!isSuperadmin(session.role)) throw new Error("Solo superadmin");
  const id = String(formData.get("id") ?? "");
  await revertAudit(id, session);
  revalidatePath("/dashboard/auditoria");
  revalidatePath("/dashboard");
}
