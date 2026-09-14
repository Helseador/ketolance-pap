import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { bogotaParts } from "@/lib/time";
import { isSuperadmin, requireSession } from "@/lib/auth";
import { surveyHasAlert } from "@/lib/survey-copy";
import { triggerSurveyNow } from "@/app/actions/surveys";

export default async function DashboardPage() {
  const session = await requireSession();
  const { date } = bogotaParts();
  const today = await prisma.survey.findMany({
    where: { localDate: date },
    include: { patient: true },
    orderBy: { slot: "asc" },
  });

  const pending = today.filter((s) => s.status !== "COMPLETED").length;
  const alerts  = today.filter((s) => surveyHasAlert(s)).length;
  const completed = today.filter((s) => s.status === "COMPLETED").length;

  return (
    <div className="max-w-5xl">
      {/* Encabezado */}
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand/50 mb-1">
          Ketolance PAP · Helse Colombia
        </p>
        <h2 className="text-3xl font-bold">
          Bienvenido, <span className="text-gradient">{session.name.split(" ")[0]}</span>
        </h2>
        <p className="mt-1 text-sm text-foreground/50">
          Encuestas de seguimiento · {date} · turnos 8:00, 12:00 y 16:00 hora Colombia
        </p>
      </div>

      {/* Stats neumórficas */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <StatCard label="Encuestas hoy" value={today.length} icon="📋" />
        <StatCard label="Completadas" value={completed} icon="✅" color="green" />
        <StatCard label="Alertas activas" value={alerts} icon="⚠️" color={alerts > 0 ? "red" : "default"} />
      </div>

      {/* Botones de disparo (superadmin) */}
      {isSuperadmin(session.role) && (
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand/40 mb-3">
            Disparar encuestas manualmente
          </p>
          <div className="flex flex-wrap gap-3">
            {[
              { slot: "MANANA",   label: "☀️  Turno mañana" },
              { slot: "MEDIODIA", label: "🌤️  Turno mediodía" },
              { slot: "TARDE",    label: "🌙  Turno tarde" },
            ].map(({ slot, label }) => (
              <form key={slot} action={triggerSurveyNow}>
                <input type="hidden" name="slot" value={slot} />
                <button
                  className="neu-btn px-5 py-2.5 text-sm font-semibold text-brand"
                >
                  {label}
                </button>
              </form>
            ))}
          </div>
        </div>
      )}

      {/* Tabla de encuestas */}
      <div className="rounded-2xl overflow-hidden" style={{ boxShadow: "var(--neu-shadow)" }}>
        <div className="gradient-brand px-6 py-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Encuestas del día</h3>
          <span className="text-xs text-white/60">{today.length} registros</span>
        </div>

        {today.length === 0 ? (
          <div className="px-6 py-12 text-center" style={{ background: "var(--card-raised)" }}>
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm font-medium text-foreground/50">
              Aún no hay encuestas de hoy.
            </p>
            <p className="text-xs text-foreground/30 mt-1">
              El envío automático corre a las 8, 12 y 16, o el superadmin puede dispararlo arriba.
            </p>
          </div>
        ) : (
          <div style={{ background: "var(--card-raised)" }}>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-brand-light/30">
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-wide text-foreground/40">Paciente</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-foreground/40">Turno</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-foreground/40">Estado</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-foreground/40">Alerta</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {today.map((s) => {
                  const alert = surveyHasAlert(s);
                  return (
                    <tr
                      key={s.id}
                      className="border-b border-brand-light/20 transition-colors hover:bg-brand-light/10"
                    >
                      <td className="px-6 py-3 font-semibold">
                        {s.patient.firstName} {s.patient.lastName}
                      </td>
                      <td className="px-4 py-3 text-foreground/60">{s.slot}</td>
                      <td className="px-4 py-3">
                        <StatusPill status={s.status} />
                      </td>
                      <td className="px-4 py-3">
                        {alert ? (
                          <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                            ⚠️ Alerta
                          </span>
                        ) : (
                          <span className="text-foreground/30">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/pacientes/${s.patientId}`}
                          className="text-xs font-semibold text-brand hover:underline"
                        >
                          Ver hoja →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color = "default",
}: {
  label: string;
  value: number;
  icon: string;
  color?: "default" | "green" | "red";
}) {
  const valueColor =
    color === "red" && value > 0
      ? "text-red-600"
      : color === "green"
      ? "text-emerald-600"
      : "text-gradient";

  return (
    <div
      className="rounded-2xl p-5"
      style={{ boxShadow: "var(--neu-shadow)", background: "var(--card-raised)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-foreground/40">{label}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className={`text-4xl font-bold ${valueColor}`}>{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string; label: string }> = {
    COMPLETED:   { bg: "#d1fae5", text: "#065f46", label: "Completada" },
    IN_PROGRESS: { bg: "#dbeafe", text: "#1e40af", label: "En progreso" },
    PENDING:     { bg: "#f3f4f6", text: "#4b5563", label: "Pendiente"  },
    FAILED:      { bg: "#fee2e2", text: "#991b1b", label: "Fallida"    },
  };
  const s = styles[status] ?? styles.PENDING;
  return (
    <span
      className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  );
}
