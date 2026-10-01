import { db, COL, newId, toDate } from "@/lib/firebase";
import { FieldValue } from "firebase-admin/firestore";
import type { SessionUser } from "@/lib/auth";

export type AuditLog = {
  id: string;
  actorId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string;
  beforeJson: string | null;
  afterJson: string | null;
  reverted: boolean;
  revertsId: string | null;
  createdAt: Date;
};

function docToAudit(id: string, data: FirebaseFirestore.DocumentData): AuditLog {
  return {
    id,
    actorId:    data.actorId ?? null,
    actorName:  data.actorName ?? null,
    actorEmail: data.actorEmail ?? null,
    action:     data.action,
    entityType: data.entityType,
    entityId:   data.entityId,
    beforeJson: data.beforeJson ?? null,
    afterJson:  data.afterJson ?? null,
    reverted:   data.reverted ?? false,
    revertsId:  data.revertsId ?? null,
    createdAt:  toDate(data.createdAt) ?? new Date(),
  };
}

export async function writeAudit(params: {
  actor?: SessionUser | null;
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  revertsId?: string;
}): Promise<void> {
  const id = newId();
  await db.collection(COL.AUDIT).doc(id).set({
    actorId:    params.actor?.id ?? null,
    actorName:  params.actor?.name ?? null,
    actorEmail: params.actor?.email ?? null,
    action:     params.action,
    entityType: params.entityType,
    entityId:   params.entityId,
    beforeJson: params.before ? JSON.stringify(params.before) : null,
    afterJson:  params.after  ? JSON.stringify(params.after)  : null,
    reverted:   false,
    revertsId:  params.revertsId ?? null,
    createdAt:  FieldValue.serverTimestamp(),
  });
}

export async function listAuditLogs(limit = 200): Promise<AuditLog[]> {
  const snap = await db.collection(COL.AUDIT)
    .orderBy("createdAt", "desc")
    .limit(limit).get();
  return snap.docs.map((d) => docToAudit(d.id, d.data()));
}

export async function revertAuditLog(logId: string, actor: SessionUser): Promise<void> {
  const doc = await db.collection(COL.AUDIT).doc(logId).get();
  if (!doc.exists) throw new Error("No existe el registro de auditoría");

  const log = docToAudit(doc.id, doc.data()!);
  if (log.reverted) throw new Error("Este cambio ya fue revertido");
  if (log.entityType !== "Survey") throw new Error("Por ahora solo se revierten encuestas");
  if (!log.beforeJson) throw new Error("No hay estado anterior para revertir");

  const before = JSON.parse(log.beforeJson);

  // Revertir la encuesta en Firestore
  await db.collection(COL.SURVEYS).doc(log.entityId).update({
    vomitos:           before.vomitos ?? null,
    diarrea:           before.diarrea ?? null,
    fiebre:            before.fiebre ?? null,
    temperaturaFiebre: before.temperaturaFiebre ?? null,
    numeroCrisis:      before.numeroCrisis ?? null,
    transgresionDieta: before.transgresionDieta ?? null,
    cambioFae:         before.cambioFae ?? null,
    glucosa:           before.glucosa ?? null,
    cetonas:           before.cetonas ?? null,
    estadoAnimo:       before.estadoAnimo ?? null,
    peso:              before.peso ?? null,
    observaciones:     before.observaciones ?? null,
    status:            before.status ?? "COMPLETED",
    updatedAt:         FieldValue.serverTimestamp(),
  });

  // Marcar log como revertido
  await db.collection(COL.AUDIT).doc(logId).update({ reverted: true });

  // Escribir log de reversión
  await writeAudit({
    actor,
    action: "REVERT",
    entityType: "Survey",
    entityId: log.entityId,
    revertsId: logId,
  });
}
