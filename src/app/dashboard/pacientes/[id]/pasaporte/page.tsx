import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { getPasaporte, savePasaporte } from "@/app/actions/pasaporte";
import { PasaporteBook } from "./pasaporte-book";

export default async function PasaportePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireSession();

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      surveys: {
        orderBy: [{ localDate: "desc" }, { slot: "asc" }],
      },
    },
  });

  if (!patient) notFound();

  const pasaporte = await getPasaporte(id);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
        <Link href="/dashboard/pacientes" className="hover:text-brand">
          Pacientes
        </Link>
        <span>/</span>
        <Link href={`/dashboard/pacientes/${id}`} className="hover:text-brand">
          {patient.firstName} {patient.lastName}
        </Link>
        <span>/</span>
        <span className="text-brand font-medium">Pasaporte Keto</span>
      </div>

      <PasaporteBook
        patientId={id}
        patientName={`${patient.firstName} ${patient.lastName}`}
        pasaporte={pasaporte}
        saveAction={savePasaporte}
        surveys={patient.surveys.map((s) => ({
          localDate:         s.localDate,
          slot:              s.slot,
          status:            s.status,
          vomitos:           s.vomitos,
          diarrea:           s.diarrea,
          fiebre:            s.fiebre,
          temperaturaFiebre: s.temperaturaFiebre,
          numeroCrisis:      s.numeroCrisis,
          transgresionDieta: s.transgresionDieta,
          cambioFae:         s.cambioFae,
          glucosa:           s.glucosa,
          cetonas:           s.cetonas,
          estadoAnimo:       s.estadoAnimo,
          peso:              s.peso,
          observaciones:     s.observaciones,
        }))}
      />
    </div>
  );
}
