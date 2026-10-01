"use server";

import { revalidatePath } from "next/cache";
import { isSuperadmin, requireSession } from "@/lib/auth";
import { listAuditLogs, revertAuditLog } from "@/lib/db/audit";

export async function listAuditLogsAction() {
  const session = await requireSession();
  if (!isSuperadmin(session.role)) throw new Error("Solo superadmin");
  return listAuditLogs(200);
}

export async function revertLogAction(formData: FormData) {
  const session = await requireSession();
  if (!isSuperadmin(session.role)) throw new Error("Solo superadmin");
  const id = String(formData.get("id") ?? "");
  await revertAuditLog(id, session);
  revalidatePath("/dashboard/auditoria");
  revalidatePath("/dashboard");
}
