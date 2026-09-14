import { prisma } from "./prisma";
import type { SessionUser } from "./auth";

export async function writeAudit(params: {
  actor?: SessionUser | null;
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  revertsId?: string;
}) {
  return prisma.auditLog.create({
    data: {
      actorId: params.actor?.id,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      beforeJson: params.before ? JSON.stringify(params.before) : null,
      afterJson: params.after ? JSON.stringify(params.after) : null,
      revertsId: params.revertsId,
    },
  });
}

export async function revertAudit(logId: string, actor: SessionUser) {
  const log = await prisma.auditLog.findUnique({ where: { id: logId } });
  if (!log) throw new Error("No existe el registro de auditoría");
  if (log.reverted) throw new Error("Este cambio ya fue revertido");
  if (log.entityType !== "Survey") {
    throw new Error("Por ahora solo se revierten encuestas");
  }
  if (!log.beforeJson) throw new Error("No hay estado anterior para revertir");

  const before = JSON.parse(log.beforeJson) as {
    vomitos?: string | null;
    diarrea?: string | null;
    fiebre?: string | null;
    transgresionDieta?: string | null;
    cambioFae?: string | null;
    observaciones?: string | null;
    status?: string;
    currentStep?: string;
    completedAt?: string | null;
  };

  const current = await prisma.survey.findUnique({ where: { id: log.entityId } });
  if (!current) throw new Error("La encuesta ya no existe");

  const restored = await prisma.survey.update({
    where: { id: log.entityId },
    data: {
      vomitos: before.vomitos ?? null,
      diarrea: before.diarrea ?? null,
      fiebre: before.fiebre ?? null,
      transgresionDieta: before.transgresionDieta ?? null,
      cambioFae: before.cambioFae ?? null,
      observaciones: before.observaciones ?? null,
      status: before.status ?? current.status,
      currentStep: before.currentStep ?? current.currentStep,
      completedAt: before.completedAt ? new Date(before.completedAt) : null,
    },
  });

  await prisma.auditLog.update({
    where: { id: logId },
    data: { reverted: true },
  });

  await writeAudit({
    actor,
    action: "REVERT",
    entityType: "Survey",
    entityId: log.entityId,
    before: current,
    after: restored,
    revertsId: logId,
  });

  return restored;
}
