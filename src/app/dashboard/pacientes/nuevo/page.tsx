export const dynamic = "force-dynamic";
import { upsertPatient } from "@/app/actions/patients";
import { redirect } from "next/navigation";

export default function NuevoPacientePage() {
  async function create(formData: FormData) {
    "use server";
    const patient = await upsertPatient(formData);
    redirect(`/dashboard/pacientes/${patient.id}`);
  }

  return (
    <div className="max-w-xl">
      <h2 className="text-2xl font-semibold">Registrar paciente</h2>
      <p className="mt-1 text-sm text-zinc-600">
        Debe existir consentimiento de datos personales (Ley 1581) antes de enviar
        encuestas.
      </p>
      <form action={create} className="mt-6 space-y-3">
        <Field name="documentId" label="Documento" required />
        <Field name="firstName" label="Nombres" required />
        <Field name="lastName" label="Apellidos" required />
        <Field name="phone" label="Celular WhatsApp (+57…)" required />
        <Field name="caregiverName" label="Acudiente" />
        <Field name="caregiverPhone" label="Celular acudiente" />
        <Field name="diagnosis" label="Diagnóstico / indicación" />
        <Field name="mipresStatus" label="Estado MIPRES" />
        <label className="block text-sm">
          Notas
          <textarea
            name="notes"
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2"
            rows={3}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input name="ketolanceActive" type="checkbox" defaultChecked />
          Ketolance activo
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input name="active" type="checkbox" defaultChecked />
          Recibe encuestas
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input name="consent" type="checkbox" required />
          Hay autorización de tratamiento de datos sensibles de salud
        </label>
        <button className="rounded-md bg-brand px-4 py-2 text-white">Guardar</button>
      </form>
    </div>
  );
}

function Field({
  name,
  label,
  required,
}: {
  name: string;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      {label}
      <input
        name={name}
        required={required}
        className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2"
      />
    </label>
  );
}
