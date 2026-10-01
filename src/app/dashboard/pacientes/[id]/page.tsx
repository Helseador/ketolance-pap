export const dynamic = "force-dynamic";
import Link from "next/link";
import { getPatient, upsertPatientAction } from "@/app/actions/patients";
import { updateSurveyAnswers } from "@/app/actions/surveys";
import { isSuperadmin, requireSession } from "@/lib/auth";
import { PatientTabs } from "./tabs";
import { CopyLinkBtn } from "./copy-link-btn";

export default async function HojaDeVidaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const patient = await getPatient(id);
  const canEdit = session.role !== "NUTRICIONISTA";

  return (
    <div className="max-w-5xl">
      {/* Encabezado */}
      <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
          Hoja de vida · Ketolance PAP
        </p>
        <h2 className="mt-1 text-3xl font-semibold">
          {patient.firstName} {patient.lastName}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Doc. {patient.documentId} · {patient.phone}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={`/dashboard/pacientes/${patient.id}/pasaporte`}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark transition-colors"
          >
            📒 Ver Pasaporte Keto
          </Link>
          {patient.surveyToken && (
            <CopyLinkBtn token={patient.surveyToken} />
          )}
        </div>
      </div>
        {isSuperadmin(session.role) && (
          <p className="text-xs text-zinc-400 mt-2">
            Los cambios quedan en auditoría.
          </p>
        )}
      </div>

      {/* Tabs interactivos (client component) */}
      <PatientTabs
        patient={{
          id: patient.id,
          documentId: patient.documentId,
          firstName: patient.firstName,
          lastName: patient.lastName,
          phone: patient.phone,
          caregiverName: patient.caregiverName ?? null,
          caregiverPhone: patient.caregiverPhone ?? null,
          diagnosis: patient.diagnosis ?? null,
          mipresStatus: patient.mipresStatus ?? null,
          notes: patient.notes ?? null,
          consentAt: patient.consentAt ?? null,
          ketolanceActive: patient.ketolanceActive,
          active: patient.active,
          createdAt: patient.createdAt,
        }}
        surveys={patient.surveys.map((s) => ({
          id: s.id,
          localDate: s.localDate,
          slot: s.slot,
          status: s.status,
          vomitos:           s.vomitos ?? null,
          diarrea:           s.diarrea ?? null,
          fiebre:            s.fiebre ?? null,
          temperaturaFiebre: s.temperaturaFiebre ?? null,
          numeroCrisis:      s.numeroCrisis ?? null,
          transgresionDieta: s.transgresionDieta ?? null,
          cambioFae:         s.cambioFae ?? null,
          glucosa:           s.glucosa ?? null,
          cetonas:           s.cetonas ?? null,
          estadoAnimo:       s.estadoAnimo ?? null,
          peso:              s.peso ?? null,
          observaciones:     s.observaciones ?? null,
          completedAt:       s.completedAt ?? null,
        }))}
        canEdit={canEdit}
        updateSurveyAction={updateSurveyAnswers}
        upsertPatientAction={upsertPatientAction}
      />
    </div>
  );
}
