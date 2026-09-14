"use client";

import { useState, useTransition, useRef } from "react";

/* ------------------------------------------------------------------ */
/* Types                                                                 */
/* ------------------------------------------------------------------ */
export type PatientTab = "datos" | "encuestas" | "editar";

export type SurveyRow = {
  id: string;
  localDate: string;
  slot: string;
  status: string;
  // Numéricos
  vomitos: string | null;
  diarrea: string | null;
  fiebre: string | null;
  temperaturaFiebre: string | null;
  numeroCrisis: string | null;
  glucosa: string | null;
  cetonas: string | null;
  peso: string | null;
  // Sí/No
  transgresionDieta: string | null;
  cambioFae: string | null;
  // Especiales
  estadoAnimo: string | null;
  observaciones: string | null;
  completedAt: Date | null;
};

export type PatientData = {
  id: string;
  documentId: string;
  firstName: string;
  lastName: string;
  phone: string;
  caregiverName: string | null;
  caregiverPhone: string | null;
  diagnosis: string | null;
  mipresStatus: string | null;
  notes: string | null;
  consentAt: Date | null;
  ketolanceActive: boolean;
  active: boolean;
  createdAt: Date;
};

/* ------------------------------------------------------------------ */
/* Constants                                                             */
/* ------------------------------------------------------------------ */
const SLOT_LABEL: Record<string, string> = {
  MANANA: "Mañana 8:00",
  MEDIODIA: "Mediodía 12:00",
  TARDE: "Tarde 16:00",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En progreso",
  COMPLETED: "Completada",
  FAILED: "Fallida",
};

const SYMPTOM_KEYS: (keyof SurveyRow)[] = [
  "vomitos", "diarrea", "fiebre", "numeroCrisis",
  "transgresionDieta", "cambioFae",
];

const SYMPTOM_LABEL: Record<string, string> = {
  vomitos:           "Vómitos",
  diarrea:           "Diarrea",
  fiebre:            "Fiebre",
  numeroCrisis:      "Crisis epilépticas",
  transgresionDieta: "Transgresión dieta",
  cambioFae:         "Cambio FAE",
};

const MOOD_LABEL: Record<string, string> = {
  BIEN: "😊 Bien", REGULAR: "😐 Regular", MAL: "😔 Mal",
};

function hasAlert(s: SurveyRow) {
  return SYMPTOM_KEYS.some((k) => {
    const v = s[k] as string | null;
    if (!v) return false;
    if (v.toUpperCase() === "SI") return true;
    const n = parseFloat(v);
    return !isNaN(n) && n > 0;
  });
}

function fmt(date: Date | null | string) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

/* ------------------------------------------------------------------ */
/* Tab bar neumórfico                                                    */
/* ------------------------------------------------------------------ */
function TabBar({
  active,
  onChange,
  canEdit,
}: {
  active: PatientTab;
  onChange: (t: PatientTab) => void;
  canEdit: boolean;
}) {
  const tabs: { id: PatientTab; label: string; icon: string }[] = [
    { id: "datos",    label: "Datos clínicos", icon: "🏥" },
    { id: "encuestas",label: "Encuestas",       icon: "📊" },
    ...(canEdit ? [{ id: "editar" as PatientTab, label: "Editar", icon: "✏️" }] : []),
  ];

  return (
    <div
      className="mt-6 flex gap-2 p-1.5 rounded-2xl"
      style={{ boxShadow: "var(--neu-shadow-inset)", background: "var(--background)" }}
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-250"
          style={
            active === t.id
              ? {
                  background: "linear-gradient(135deg, var(--brand), var(--brand-dark))",
                  boxShadow: "4px 4px 10px #b01062, -2px -2px 6px #f3d0e3",
                  color: "white",
                }
              : {
                  color: "var(--foreground)",
                  opacity: 0.55,
                }
          }
        >
          <span>{t.icon}</span>
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tab: Datos clínicos                                                   */
/* ------------------------------------------------------------------ */
function NeuSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl overflow-hidden" style={{ boxShadow: "var(--neu-shadow)", background: "var(--card-raised)" }}>
      <div className="px-5 py-3 gradient-brand">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function TabDatos({ patient }: { patient: PatientData }) {
  return (
    <div className="space-y-5">
      {/* Estado */}
      <div className="flex flex-wrap gap-2">
        <Badge label="Ketolance" value={patient.ketolanceActive ? "Activo" : "Inactivo"} color={patient.ketolanceActive ? "green" : "zinc"} />
        <Badge label="Encuestas" value={patient.active ? "Activas" : "Pausadas"} color={patient.active ? "green" : "zinc"} />
        <Badge label="Consentimiento" value={patient.consentAt ? "Firmado" : "Pendiente"} color={patient.consentAt ? "green" : "orange"} />
      </div>

      <NeuSection title="Identificación">
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <Field label="Documento" value={patient.documentId} />
          <Field label="WhatsApp" value={patient.phone} />
          <Field label="Nombres" value={patient.firstName} />
          <Field label="Apellidos" value={patient.lastName} />
          <Field label="Registrado" value={fmt(patient.createdAt)} />
          <Field label="Consentimiento" value={fmt(patient.consentAt)} />
        </dl>
      </NeuSection>

      {(patient.caregiverName || patient.caregiverPhone) && (
        <NeuSection title="Acudiente / Cuidador">
          <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            <Field label="Nombre" value={patient.caregiverName} />
            <Field label="Celular" value={patient.caregiverPhone} />
          </dl>
        </NeuSection>
      )}

      <NeuSection title="Información clínica">
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <Field label="Diagnóstico / indicación" value={patient.diagnosis} full />
          <Field label="Estado MIPRES" value={patient.mipresStatus} />
        </dl>
        {patient.notes && (
          <div className="mt-4 pt-4 border-t border-brand-light/40">
            <p className="text-xs font-bold uppercase tracking-wide text-brand/50 mb-2">Notas</p>
            <p className="text-sm whitespace-pre-wrap text-foreground/70">{patient.notes}</p>
          </div>
        )}
      </NeuSection>
    </div>
  );
}

function Badge({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "green" | "orange" | "zinc";
}) {
  const colors = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
    zinc: "bg-zinc-100 text-zinc-600 border-zinc-200",
  };
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${colors[color]}`}>
      {label}: {value}
    </span>
  );
}

function Field({
  label,
  value,
  full,
}: {
  label: string;
  value: string | null | undefined;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium">{value || "—"}</dd>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Symptom chart (pure CSS bar chart)                                   */
/* ------------------------------------------------------------------ */
function SymptomsChart({ surveys }: { surveys: SurveyRow[] }) {
  const completed = surveys.filter((s) => s.status === "COMPLETED");
  if (completed.length === 0) return null;

  const counts: Record<string, number> = {};
  for (const key of SYMPTOM_KEYS) {
    counts[key as string] = completed.filter(
      (s) => (s[key] as string | null)?.toUpperCase() === "SI",
    ).length;
  }
  const max = Math.max(...Object.values(counts), 1);

  return (
    <section className="rounded-xl border border-zinc-200 bg-card p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-4">
        Frecuencia de síntomas ({completed.length} encuestas completadas)
      </h3>
      <div className="space-y-3">
        {SYMPTOM_KEYS.map((key) => {
          const count = counts[key as string];
          const pct = Math.round((count / max) * 100);
          const hasAny = count > 0;
          return (
            <div key={key as string} className="flex items-center gap-3">
              <span className="w-36 shrink-0 text-xs text-zinc-600">
                {SYMPTOM_LABEL[key as string]}
              </span>
              <div className="flex-1 h-3 rounded-full bg-zinc-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    hasAny ? "bg-accent" : "bg-zinc-300"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-8 text-right text-xs font-medium text-zinc-700">{count}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Tab: Encuestas                                                        */
/* ------------------------------------------------------------------ */
function TabEncuestas({
  surveys,
  updateAction,
  canEditSurveys,
}: {
  surveys: SurveyRow[];
  updateAction: (formData: FormData) => Promise<void>;
  canEditSurveys: boolean;
}) {
  const [filterDate, setFilterDate] = useState("");
  const [filterSlot, setFilterSlot] = useState("");

  const filtered = surveys.filter((s) => {
    if (filterDate && !s.localDate.startsWith(filterDate)) return false;
    if (filterSlot && s.slot !== filterSlot) return false;
    return true;
  });

  const alertCount = surveys.filter(hasAlert).length;

  return (
    <div className="space-y-5">
      {/* Resumen */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total encuestas" value={surveys.length} />
        <StatCard label="Completadas" value={surveys.filter((s) => s.status === "COMPLETED").length} />
        <StatCard label="Con alerta" value={alertCount} warn={alertCount > 0} />
      </div>

      {/* Gráfica */}
      <SymptomsChart surveys={surveys} />

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="month"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="neu-input px-3 py-1.5 text-sm"
          style={{ borderRadius: "10px" }}
        />
        <select
          value={filterSlot}
          onChange={(e) => setFilterSlot(e.target.value)}
          className="neu-input px-3 py-1.5 text-sm"
          style={{ borderRadius: "10px" }}
        >
          <option value="">Todos los turnos</option>
          <option value="MANANA">☀️ Mañana 8:00</option>
          <option value="MEDIODIA">🌤️ Mediodía 12:00</option>
          <option value="TARDE">🌙 Tarde 16:00</option>
        </select>
        {(filterDate || filterSlot) && (
          <button onClick={() => { setFilterDate(""); setFilterSlot(""); }}
            className="text-sm text-brand underline font-medium">
            Limpiar
          </button>
        )}
        <span className="ml-auto text-xs text-foreground/40 font-medium">
          {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tarjetas por día */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="py-12 text-center rounded-2xl" style={{ boxShadow: "var(--neu-shadow-inset)" }}>
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm text-foreground/40">No hay encuestas para los filtros seleccionados.</p>
          </div>
        )}
        {filtered.map((s) => (
          <SurveyCard key={s.id} survey={s} updateAction={updateAction} canEdit={canEditSurveys} />
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={`mt-1 text-3xl font-semibold ${warn ? "text-accent" : ""}`}>{value}</p>
    </div>
  );
}

function SurveyCard({
  survey,
  updateAction,
  canEdit,
}: {
  survey: SurveyRow;
  updateAction: (formData: FormData) => Promise<void>;
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const alert = hasAlert(survey);

  function NumVal({ v }: { v: string | null }) {
    if (v === null || v === undefined || v === "") return <span className="text-foreground/25">—</span>;
    const n = parseFloat(v);
    const isAlert = !isNaN(n) && n > 0;
    return <span className={isAlert ? "font-bold text-accent" : "text-foreground/70"}>{v}</span>;
  }

  function YNVal({ v }: { v: string | null }) {
    if (!v) return <span className="text-foreground/25">—</span>;
    return v === "SI"
      ? <span className="font-bold text-accent">Sí</span>
      : <span className="text-foreground/50">No</span>;
  }

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        boxShadow: alert ? "6px 6px 14px #e8bfbf, -6px -6px 14px #ffffff" : "var(--neu-shadow)",
        background: "var(--card-raised)",
        border: alert ? "1px solid #fca5a5" : "none",
      }}
    >
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-5 py-3.5 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-3">
          <div className="text-lg">{survey.slot === "MANANA" ? "☀️" : survey.slot === "MEDIODIA" ? "🌤️" : "🌙"}</div>
          <div>
            <p className="text-sm font-bold">{survey.localDate} · {SLOT_LABEL[survey.slot]}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <StatusBadge status={survey.status} />
              {alert && <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">⚠️ Alerta</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-foreground/40">
          {/* Resumen rápido de valores clave */}
          {survey.numeroCrisis && survey.numeroCrisis !== "0" && (
            <span className="font-bold text-accent">⚡ {survey.numeroCrisis} crisis</span>
          )}
          {survey.glucosa && survey.glucosa !== "0" && (
            <span>🩸 {survey.glucosa} mg/dl</span>
          )}
          <span className="text-lg">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {/* Detalle expandible */}
      {open && (
        <div className="px-5 pb-4 border-t border-brand-light/30">
          {!editing ? (
            <>
              {/* Grid de datos */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                <DataCell label="Vómitos" value={<NumVal v={survey.vomitos} />} />
                <DataCell label="Diarrea" value={<NumVal v={survey.diarrea} />} />
                <DataCell label="Fiebre (ep.)" value={<NumVal v={survey.fiebre} />} />
                {survey.temperaturaFiebre && (
                  <DataCell label="Temperatura °C" value={<NumVal v={survey.temperaturaFiebre} />} />
                )}
                <DataCell label="Crisis" value={<NumVal v={survey.numeroCrisis} />} />
                <DataCell label="Trans. dieta" value={<YNVal v={survey.transgresionDieta} />} />
                <DataCell label="Cambio FAE" value={<YNVal v={survey.cambioFae} />} />
                <DataCell label="Glucosa (mg/dl)" value={<NumVal v={survey.glucosa} />} />
                <DataCell label="Cetonas" value={<NumVal v={survey.cetonas} />} />
                <DataCell label="Estado ánimo" value={
                  <span className="text-sm">{survey.estadoAnimo ? (MOOD_LABEL[survey.estadoAnimo] ?? survey.estadoAnimo) : "—"}</span>
                } />
                {survey.peso && (
                  <DataCell label="Peso (kg)" value={<NumVal v={survey.peso} />} />
                )}
              </div>
              {survey.observaciones && (
                <div className="mt-3 rounded-xl px-3 py-2.5 text-sm text-foreground/70"
                  style={{ boxShadow: "var(--neu-shadow-inset)" }}>
                  💬 {survey.observaciones}
                </div>
              )}
              {canEdit && (
                <button onClick={() => setEditing(true)}
                  className="mt-3 text-xs font-semibold text-brand hover:underline">
                  ✏️ Editar respuestas
                </button>
              )}
            </>
          ) : (
            <form
              action={async (fd) => {
                startTransition(async () => {
                  await updateAction(fd);
                  setSaved(true);
                  setEditing(false);
                  setTimeout(() => setSaved(false), 3000);
                });
              }}
              className="mt-4 space-y-4"
            >
              <input type="hidden" name="id" value={survey.id} />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <NumField name="vomitos" label="Vómitos" defaultValue={survey.vomitos} />
                <NumField name="diarrea" label="Diarrea" defaultValue={survey.diarrea} />
                <NumField name="fiebre" label="Fiebre (ep.)" defaultValue={survey.fiebre} />
                <NumField name="temperaturaFiebre" label="Temp. °C" defaultValue={survey.temperaturaFiebre} />
                <NumField name="numeroCrisis" label="Crisis" defaultValue={survey.numeroCrisis} />
                <NumField name="glucosa" label="Glucosa (mg/dl)" defaultValue={survey.glucosa} />
                <NumField name="cetonas" label="Cetonas" defaultValue={survey.cetonas} />
                <NumField name="peso" label="Peso (kg)" defaultValue={survey.peso} />
                <div>
                  <label className="text-xs font-medium text-foreground/50 block mb-1">Estado ánimo</label>
                  <select name="estadoAnimo" defaultValue={survey.estadoAnimo ?? ""}
                    className="neu-input w-full px-2 py-1.5 text-sm" style={{ borderRadius: "8px" }}>
                    <option value="">—</option>
                    <option value="BIEN">😊 Bien</option>
                    <option value="REGULAR">😐 Regular</option>
                    <option value="MAL">😔 Mal</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground/50 block mb-1">Trans. dieta</label>
                  <select name="transgresionDieta" defaultValue={survey.transgresionDieta ?? ""}
                    className="neu-input w-full px-2 py-1.5 text-sm" style={{ borderRadius: "8px" }}>
                    <option value="">—</option>
                    <option value="SI">Sí</option>
                    <option value="NO">No</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground/50 block mb-1">Cambio FAE</label>
                  <select name="cambioFae" defaultValue={survey.cambioFae ?? ""}
                    className="neu-input w-full px-2 py-1.5 text-sm" style={{ borderRadius: "8px" }}>
                    <option value="">—</option>
                    <option value="SI">Sí</option>
                    <option value="NO">No</option>
                  </select>
                </div>
              </div>
              <label className="block text-xs font-medium text-foreground/50">
                Observaciones
                <textarea name="observaciones" defaultValue={survey.observaciones ?? ""}
                  rows={2} className="neu-input mt-1 w-full px-3 py-2 text-sm"
                  style={{ borderRadius: "8px" }} />
              </label>
              <div className="flex items-center gap-3">
                <button type="submit" disabled={pending}
                  className="neu-btn-brand px-4 py-1.5 text-xs font-semibold rounded-lg">
                  {pending ? "Guardando…" : "Guardar"}
                </button>
                <button type="button" onClick={() => setEditing(false)}
                  className="neu-btn px-4 py-1.5 text-xs font-semibold rounded-lg text-foreground/60">
                  Cancelar
                </button>
                {saved && <span className="text-xs text-emerald-600 font-medium">✓ Guardado</span>}
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

function DataCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl p-2.5" style={{ boxShadow: "var(--neu-shadow-inset)" }}>
      <p className="text-[10px] font-bold uppercase tracking-wide text-foreground/35 mb-1">{label}</p>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

function NumField({ name, label, defaultValue }: { name: string; label: string; defaultValue: string | null }) {
  return (
    <div>
      <label className="text-xs font-medium text-foreground/50 block mb-1">{label}</label>
      <input type="number" name={name} defaultValue={defaultValue ?? ""} min="0" step="0.1"
        className="neu-input w-full px-2 py-1.5 text-sm" style={{ borderRadius: "8px" }} />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    COMPLETED: "bg-emerald-50 text-emerald-700",
    IN_PROGRESS: "bg-blue-50 text-blue-700",
    PENDING: "bg-zinc-100 text-zinc-600",
    FAILED: "bg-red-50 text-red-700",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? "bg-zinc-100 text-zinc-600"}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function AnswerSelect({
  name,
  label,
  value,
}: {
  name: string;
  label: string;
  value: string | null;
}) {
  return (
    <label className="text-xs">
      {label}
      <select
        name={name}
        defaultValue={value ?? ""}
        className="mt-1 w-full rounded border border-zinc-300 px-2 py-1 text-sm"
      >
        <option value="">Sin dato</option>
        <option value="SI">Sí</option>
        <option value="NO">No</option>
      </select>
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Tab: Editar paciente                                                  */
/* ------------------------------------------------------------------ */
function TabEditar({
  patient,
  upsertAction,
}: {
  patient: PatientData;
  upsertAction: (formData: FormData) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <form
      action={async (fd) => {
        startTransition(async () => {
          await upsertAction(fd);
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        });
      }}
      className="mt-6 max-w-2xl space-y-6"
    >
      <input type="hidden" name="id" value={patient.id} />

      <section className="rounded-xl border border-zinc-200 bg-card">
        <div className="border-b border-zinc-100 px-5 py-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Identificación
          </h3>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <EditField name="documentId" label="Documento" defaultValue={patient.documentId} required />
          <EditField name="phone" label="Celular WhatsApp (+57…)" defaultValue={patient.phone} required />
          <EditField name="firstName" label="Nombres" defaultValue={patient.firstName} required />
          <EditField name="lastName" label="Apellidos" defaultValue={patient.lastName} required />
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-card">
        <div className="border-b border-zinc-100 px-5 py-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Acudiente / Cuidador
          </h3>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <EditField name="caregiverName" label="Nombre acudiente" defaultValue={patient.caregiverName} />
          <EditField name="caregiverPhone" label="Celular acudiente" defaultValue={patient.caregiverPhone} />
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-card">
        <div className="border-b border-zinc-100 px-5 py-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Información clínica
          </h3>
        </div>
        <div className="grid gap-4 p-5">
          <EditField name="diagnosis" label="Diagnóstico / indicación" defaultValue={patient.diagnosis} />
          <EditField name="mipresStatus" label="Estado MIPRES" defaultValue={patient.mipresStatus} />
          <label className="block text-sm">
            Notas
            <textarea
              name="notes"
              defaultValue={patient.notes ?? ""}
              rows={3}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-card">
        <div className="border-b border-zinc-100 px-5 py-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Estado del paciente
          </h3>
        </div>
        <div className="flex flex-col gap-3 p-5">
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              name="ketolanceActive"
              defaultChecked={patient.ketolanceActive}
              className="h-4 w-4 rounded border-zinc-300"
            />
            Ketolance activo
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              name="active"
              defaultChecked={patient.active}
              className="h-4 w-4 rounded border-zinc-300"
            />
            Recibe encuestas WhatsApp
          </label>
          {!patient.consentAt && (
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                name="consent"
                className="h-4 w-4 rounded border-zinc-300"
              />
              Registrar consentimiento ahora
            </label>
          )}
          {patient.consentAt && (
            <p className="text-xs text-emerald-700">
              Consentimiento registrado el {fmt(patient.consentAt)}
            </p>
          )}
        </div>
      </section>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar cambios"}
        </button>
        {saved && (
          <span className="text-sm text-emerald-700 font-medium">
            Cambios guardados correctamente.
          </span>
        )}
      </div>
    </form>
  );
}

function EditField({
  name,
  label,
  defaultValue,
  required,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      {label}
      {required && <span className="ml-1 text-accent">*</span>}
      <input
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
      />
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Root export con animación de dirección                                */
/* ------------------------------------------------------------------ */
const TAB_ORDER: PatientTab[] = ["datos", "encuestas", "editar"];

export function PatientTabs({
  patient,
  surveys,
  canEdit,
  updateSurveyAction,
  upsertPatientAction,
}: {
  patient: PatientData;
  surveys: SurveyRow[];
  canEdit: boolean;
  updateSurveyAction: (formData: FormData) => Promise<void>;
  upsertPatientAction: (formData: FormData) => Promise<void>;
}) {
  const [tab, setTab] = useState<PatientTab>("datos");
  const [animClass, setAnimClass] = useState("tab-enter-right");
  const [key, setKey] = useState(0);

  function handleChange(next: PatientTab) {
    const curIdx = TAB_ORDER.indexOf(tab);
    const nxtIdx = TAB_ORDER.indexOf(next);
    setAnimClass(nxtIdx > curIdx ? "tab-enter-right" : "tab-enter-left");
    setKey((k) => k + 1);
    setTab(next);
  }

  return (
    <div>
      <TabBar active={tab} onChange={handleChange} canEdit={canEdit} />

      <div key={key} className={`mt-6 ${animClass}`}>
        {tab === "datos" && <TabDatos patient={patient} />}
        {tab === "encuestas" && (
          <TabEncuestas
            surveys={surveys}
            updateAction={updateSurveyAction}
            canEditSurveys={canEdit}
          />
        )}
        {tab === "editar" && canEdit && (
          <TabEditar patient={patient} upsertAction={upsertPatientAction} />
        )}
      </div>
    </div>
  );
}
