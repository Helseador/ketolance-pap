import { notFound } from "next/navigation";
import { bogotaParts, slotForHour } from "@/lib/time";
import { getPatientByToken, submitEncuesta } from "@/app/actions/encuesta";
import { EncuestaForm } from "./encuesta-form";

export default async function EncuestaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const patient = await getPatientByToken(token);
  if (!patient) notFound();

  const { hour } = bogotaParts();
  const slot = slotForHour(hour) ?? (hour < 12 ? "MANANA" : hour < 16 ? "MEDIODIA" : "TARDE");

  return (
    <EncuestaForm
      token={token}
      patientName={`${patient.firstName} ${patient.lastName}`}
      slot={slot}
      submitAction={submitEncuesta}
    />
  );
}
