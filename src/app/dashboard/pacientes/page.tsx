export const dynamic = "force-dynamic";
import Link from "next/link";
import { listPatientsAction as listPatients } from "@/app/actions/patients";
import { requireSession } from "@/lib/auth";
import { PatientCard } from "./patient-card";

export default async function PacientesPage() {
  const session = await requireSession();
  const patients = await listPatients();

  return (
    <div className="max-w-5xl">
      {/* Encabezado */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand/50 mb-1">
            Gestión
          </p>
          <h2 className="text-3xl font-bold">
            <span className="text-gradient">Pacientes</span>
          </h2>
          <p className="mt-1 text-sm text-foreground/50">
            {patients.length} paciente{patients.length !== 1 ? "s" : ""} registrado{patients.length !== 1 ? "s" : ""}. Solo los activos reciben WhatsApp.
          </p>
        </div>
        {session.role !== "NUTRICIONISTA" && (
          <Link
            href="/dashboard/pacientes/nuevo"
            className="neu-btn-brand px-5 py-2.5 text-sm font-semibold"
          >
            + Registrar paciente
          </Link>
        )}
      </div>

      {/* Grid de tarjetas */}
      {patients.length === 0 ? (
        <div
          className="rounded-2xl px-8 py-16 text-center"
          style={{ boxShadow: "var(--neu-shadow-inset)", background: "var(--background)" }}
        >
          <p className="text-5xl mb-4">👥</p>
          <p className="text-lg font-semibold text-foreground/60">No hay pacientes registrados</p>
          <p className="text-sm text-foreground/40 mt-1">Registra el primero usando el botón arriba.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {patients.map((p) => (
            <PatientCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}
