"use server";

import { revalidatePath } from "next/cache";
import { isSuperadmin, requireSession } from "@/lib/auth";
import { writeAudit } from "@/lib/db/audit";
import { findSurveyById, updateSurvey } from "@/lib/db/surveys";

export async function updateSurveyAnswers(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id") ?? "");
  const before = await findSurveyById(id);
  if (!before) throw new Error("Encuesta no encontrada");

  const str = (k: string) => String(formData.get(k) ?? "") || null;

  const after = await updateSurvey(id, {
    vomitos:           str("vomitos"),
    diarrea:           str("diarrea"),
    fiebre:            str("fiebre"),
    temperaturaFiebre: str("temperaturaFiebre"),
    numeroCrisis:      str("numeroCrisis"),
    transgresionDieta: str("transgresionDieta"),
    cambioFae:         str("cambioFae"),
    glucosa:           str("glucosa"),
    cetonas:           str("cetonas"),
    estadoAnimo:       str("estadoAnimo"),
    peso:              str("peso"),
    observaciones:     str("observaciones"),
  });

  await writeAudit({
    actor: session,
    action: "UPDATE",
    entityType: "Survey",
    entityId: id,
    before,
    after,
  });

  revalidatePath(`/dashboard/pacientes/${before.patientId}`);
  revalidatePath("/dashboard");
}

export async function triggerSurveyNow(formData: FormData) {
  const session = await requireSession();
  if (!isSuperadmin(session.role)) throw new Error("Solo superadmin");
  const slot = String(formData.get("slot")) as "MANANA" | "MEDIODIA" | "TARDE";
  const { dispatchDueSurveys } = await import("@/lib/survey");
  await dispatchDueSurveys(slot);
  revalidatePath("/dashboard");
}
