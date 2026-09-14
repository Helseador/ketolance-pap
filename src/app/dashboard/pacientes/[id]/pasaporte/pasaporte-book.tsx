"use client";

import Image from "next/image";
import { useState, useTransition, useRef } from "react";
import type { Pasaporte } from "@prisma/client";

/* ------------------------------------------------------------------ */
/* Tipos                                                                 */
/* ------------------------------------------------------------------ */
type Props = {
  patientId: string;
  patientName: string;
  pasaporte: Pasaporte | null;
  saveAction: (fd: FormData) => Promise<void>;
  surveys: SurveyForTable[];
  /** Números de hoja (1-based) que son solo lectura */
  readOnlySheets?: number[];
};

export type SurveyForTable = {
  localDate: string;
  slot: string;
  status: string;
  vomitos: string | null | undefined;
  diarrea: string | null | undefined;
  fiebre: string | null | undefined;
  temperaturaFiebre: string | null | undefined;
  numeroCrisis: string | null | undefined;
  transgresionDieta: string | null | undefined;
  cambioFae: string | null | undefined;
  glucosa: string | null | undefined;
  cetonas: string | null | undefined;
  estadoAnimo: string | null | undefined;
  peso: string | null | undefined;
  observaciones: string | null | undefined;
};

/* ------------------------------------------------------------------ */
/* Helpers visuales                                                      */
/* ------------------------------------------------------------------ */
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

const SLOT_SHORT: Record<string, string> = {
  MANANA: "M",
  MEDIODIA: "MD",
  TARDE: "T",
};

function yn(v: string | null) {
  if (!v) return "";
  return v.toUpperCase() === "SI" ? "Sí" : "No";
}

/* Decoraciones SVG inline para la portada */
function Deco() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {/* Sol */}
      <span className="absolute top-6 right-8 text-5xl opacity-60">☀️</span>
      {/* Abeja */}
      <span className="absolute top-20 left-6 text-4xl opacity-50">🐝</span>
      {/* Nube */}
      <span className="absolute bottom-28 right-6 text-4xl opacity-40">☁️</span>
      {/* Manzana */}
      <span className="absolute bottom-16 left-8 text-4xl opacity-50">🍎</span>
      {/* Fresa */}
      <span className="absolute top-1/2 right-4 text-3xl opacity-40">🍓</span>
      {/* Corazones pequeños */}
      <span className="absolute top-36 right-16 text-2xl opacity-30">💗</span>
      <span className="absolute bottom-40 left-20 text-2xl opacity-30">💗</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Campo de formulario reutilizable                                      */
/* ------------------------------------------------------------------ */
function F({
  label,
  name,
  defaultValue,
  textarea,
  placeholder,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  textarea?: boolean;
  placeholder?: string;
  type?: string;
}) {
  const base =
    "mt-1 w-full rounded-lg border border-pink-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/30";
  return (
    <label className="block text-xs font-medium text-zinc-600">
      {label}
      {textarea ? (
        <textarea
          name={name}
          defaultValue={defaultValue ?? ""}
          placeholder={placeholder}
          rows={3}
          className={base}
        />
      ) : (
        <input
          type={type}
          name={name}
          defaultValue={defaultValue ?? ""}
          placeholder={placeholder}
          className={base}
        />
      )}
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Navegación del libro neumórfica                                       */
/* ------------------------------------------------------------------ */
function Nav({
  page,
  total,
  onPrev,
  onNext,
}: {
  page: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div
      className="flex items-center justify-between px-6 py-3"
      style={{ borderTop: "1px solid #e8d8e4", background: "var(--background)" }}
    >
      <button
        onClick={onPrev}
        disabled={page === 0}
        className="flex items-center gap-1 px-4 py-2 text-sm font-semibold text-brand rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        style={page !== 0 ? { boxShadow: "var(--neu-shadow-sm)" } : {}}
      >
        ← Anterior
      </button>
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              height: "8px",
              width: i === page ? "24px" : "8px",
              background: i === page ? "var(--brand)" : "#e8d0e0",
            }}
          />
        ))}
      </div>
      <button
        onClick={onNext}
        disabled={page === total - 1}
        className="flex items-center gap-1 px-4 py-2 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        style={
          page !== total - 1
            ? { background: "linear-gradient(135deg, var(--brand), var(--brand-dark))", boxShadow: "3px 3px 8px #b01062, -2px -2px 6px #f3d0e3" }
            : {}
        }
      >
        Siguiente →
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cabecera de hoja (logo + número)                                     */
/* ------------------------------------------------------------------ */
function PageHeader({ number, title }: { number: number; title: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Image
          src="/imagen-ketolance.jpg"
          alt="Ketolance"
          width={32}
          height={32}
          className="rounded-md object-contain bg-white border border-pink-100 p-0.5"
        />
        <span className="text-[10px] font-bold uppercase tracking-widest text-brand">
          KETOLance · Nutrigénomica
        </span>
      </div>
      <span className="text-xs text-pink-300 font-medium">Hoja {number} / 8</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Botón guardar compartido                                              */
/* ------------------------------------------------------------------ */
function SaveBtn({ pending, saved }: { pending: boolean; saved: boolean }) {
  return (
    <div className="flex items-center gap-3 mt-4">
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60 transition-colors"
      >
        {pending ? "Guardando…" : "Guardar esta hoja"}
      </button>
      {saved && (
        <span className="text-xs text-emerald-600 font-medium">
          ✓ Guardado
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* HOJA 1 — Portada                                                      */
/* ------------------------------------------------------------------ */
function Hoja1({ patientName }: { patientName: string }) {
  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center px-8 py-10">
      <Deco />
      <Image
        src="/imagen-ketolance.jpg"
        alt="Ketolance"
        width={90}
        height={90}
        className="rounded-2xl object-contain bg-white border-2 border-pink-200 p-1 shadow-md mb-6 relative z-10"
      />
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand/60 mb-2 relative z-10">
        KETOLance by Nutrigénomica
      </p>
      <h1 className="text-4xl font-bold text-brand leading-tight relative z-10">
        Mi pasaporte<br />
        <span className="text-accent">Keto</span>
      </h1>
      <p className="mt-4 text-base italic text-zinc-500 relative z-10">
        "Cuidándome con amor y constancia"
      </p>
      {patientName && (
        <div className="mt-8 rounded-xl border-2 border-dashed border-pink-200 px-6 py-3 relative z-10">
          <p className="text-xs text-zinc-400 uppercase tracking-wide">Paciente</p>
          <p className="text-lg font-semibold text-zinc-700">{patientName}</p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* HOJA 2 — Propósito                                                    */
/* ------------------------------------------------------------------ */
function Hoja2() {
  return (
    <div className="flex flex-col h-full px-8 py-6">
      <PageHeader number={2} title="Propósito" />
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
        <div className="text-5xl">💗</div>
        <h2 className="text-2xl font-bold text-brand">Propósito del Pasaporte</h2>
        <p className="text-sm leading-relaxed text-zinc-600 max-w-sm">
          Este <strong className="text-brand">"Pasaporte Keto"</strong> tiene un propósito valioso:{" "}
          facilitar el seguimiento clínico y cotidiano de niños con epilepsia refractaria bajo
          terapia cetogénica. Para hacerlo más cercano, empático y útil para padres y cuidadores.
        </p>
        <div className="flex items-center gap-3 mt-4">
          <Image
            src="/imagen-ketolance.jpg"
            alt="Ketolance"
            width={48}
            height={48}
            className="rounded-xl object-contain bg-white border border-pink-100 p-0.5"
          />
          <div className="text-left">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand">
              KETOLance
            </p>
            <p className="text-xs text-zinc-500">by Nutrigénomica</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* HOJA 3 — Introducción para familias                                   */
/* ------------------------------------------------------------------ */
function Hoja3() {
  return (
    <div className="flex flex-col h-full px-8 py-6">
      <PageHeader number={3} title="Para las familias" />
      <h2 className="text-xl font-bold text-brand mb-4">Introducción para las familias</h2>
      <div className="flex-1 overflow-y-auto space-y-4">
        <p className="text-sm leading-relaxed text-zinc-600">
          Este pasaporte es una herramienta pensada para <strong>ti</strong>, que acompañas con
          amor y atención el tratamiento de tu hijo o hija con terapia cetogénica. Aquí encontrarás
          toda la información esencial para que médicos, cuidadores y familiares puedan actuar con
          rapidez y seguridad en cualquier situación.
        </p>
        <p className="text-sm leading-relaxed text-zinc-600">
          Es una guía de respaldo, pero también un reflejo del compromiso que tú tienes con su
          bienestar.
        </p>
        <div className="rounded-xl bg-pink-50 border border-pink-200 p-4 flex gap-3 items-start">
          <span className="text-2xl">👜</span>
          <div>
            <p className="text-sm font-bold text-brand">Llévalo siempre contigo</p>
            <p className="text-xs text-zinc-500 mt-1">
              Actualízalo cuando haya cambios. Y recuerda:{" "}
              <strong>cada dato aquí puede hacer la diferencia.</strong>
            </p>
          </div>
        </div>
        <div className="rounded-xl bg-brand/5 border border-brand/20 p-4 flex gap-3 items-start">
          <span className="text-2xl">💗</span>
          <p className="text-xs text-zinc-500 italic leading-relaxed">
            "Con paciencia, constancia y amor, cada día es un paso más hacia el bienestar de tu
            pequeño guerrero keto."
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* HOJA 4 — Información clave                                            */
/* ------------------------------------------------------------------ */
function Hoja4({
  data,
  patientId,
  saveAction,
}: {
  data: Pasaporte | null;
  patientId: string;
  saveAction: (fd: FormData) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <div className="flex flex-col h-full px-8 py-6">
      <PageHeader number={4} title="Información clave" />
      <h2 className="text-xl font-bold text-brand mb-1">¡Información clave!</h2>
      <p className="text-xs text-zinc-400 mb-4">Completa los datos del paciente y sus especialistas.</p>
      <form
        action={async (fd) => {
          startTransition(async () => {
            await saveAction(fd);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
          });
        }}
        className="flex-1 overflow-y-auto space-y-4"
      >
        <input type="hidden" name="patientId" value={patientId} />

        <section>
          <p className="text-[11px] font-bold uppercase tracking-widest text-brand mb-2">
            Identificación
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <F label="Fecha de nacimiento" name="birthDate" type="date" defaultValue={data?.birthDate} />
            <F label="Grupo sanguíneo" name="bloodType" defaultValue={data?.bloodType} placeholder="Ej: O+" />
          </div>
        </section>

        <section>
          <p className="text-[11px] font-bold uppercase tracking-widest text-brand mb-2">
            Contacto de emergencia
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <F label="Nombre del cuidador principal" name="emergencyName" defaultValue={data?.emergencyName} />
            <F label="Teléfono" name="emergencyPhone" defaultValue={data?.emergencyPhone} placeholder="+57..." />
          </div>
        </section>

        <section>
          <p className="text-[11px] font-bold uppercase tracking-widest text-brand mb-2">
            Especialistas
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <F label="Nombre del Neurólogo/a" name="neurologistName" defaultValue={data?.neurologistName} />
            <F label="Teléfono Neurólogo/a" name="neurologistPhone" defaultValue={data?.neurologistPhone} />
            <F label="Nombre del Nutricionista" name="nutritionistName" defaultValue={data?.nutritionistName} />
            <F label="Teléfono Nutricionista" name="nutritionistPhone" defaultValue={data?.nutritionistPhone} />
          </div>
        </section>

        <SaveBtn pending={pending} saved={saved} />
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* HOJA 5 — Medicamentos y alergias                                      */
/* ------------------------------------------------------------------ */
function Hoja5({
  data,
  patientId,
  saveAction,
}: {
  data: Pasaporte | null;
  patientId: string;
  saveAction: (fd: FormData) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <div className="flex flex-col h-full px-8 py-6">
      <PageHeader number={5} title="Medicamentos y alergias" />
      <h2 className="text-xl font-bold text-brand mb-4">Medicamentos y Alergias</h2>
      <form
        action={async (fd) => {
          startTransition(async () => {
            await saveAction(fd);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
          });
        }}
        className="flex-1 overflow-y-auto space-y-4"
      >
        <input type="hidden" name="patientId" value={patientId} />

        <section className="rounded-xl border border-pink-100 bg-pink-50/40 p-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-brand mb-2 flex items-center gap-1">
            💊 Anticonvulsivos
          </p>
          <F
            label="Medicamentos anticonvulsivos (nombre, dosis y horario)"
            name="anticonvulsants"
            textarea
            defaultValue={data?.anticonvulsants}
            placeholder={"Ej:\nDepakote 250mg — mañana y noche\nKeppra 500mg — cada 12h"}
          />
        </section>

        <section className="rounded-xl border border-pink-100 bg-pink-50/40 p-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-brand mb-2 flex items-center gap-1">
            🌿 Otros medicamentos y suplementos
          </p>
          <F
            label="Vitaminas, minerales u otros (nombre y dosis)"
            name="supplements"
            textarea
            defaultValue={data?.supplements}
            placeholder={"Ej:\nVitamina D3 1000 UI\nSelenio 50mcg"}
          />
        </section>

        <section className="rounded-xl border border-red-100 bg-red-50/40 p-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-red-600 mb-2 flex items-center gap-1">
            ⚠️ Alergias conocidas
          </p>
          <F
            label="Alergias alimentarias o medicamentosas"
            name="allergies"
            textarea
            defaultValue={data?.allergies}
            placeholder="Ej: Alergia a la penicilina, intolerancia a la lactosa..."
          />
        </section>

        <SaveBtn pending={pending} saved={saved} />
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* HOJA 6 — Dieta cetogénica                                             */
/* ------------------------------------------------------------------ */
function Hoja6({
  data,
  patientId,
  saveAction,
}: {
  data: Pasaporte | null;
  patientId: string;
  saveAction: (fd: FormData) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <div className="flex flex-col h-full px-8 py-6">
      <PageHeader number={6} title="Dieta cetogénica" />
      <h2 className="text-xl font-bold text-brand mb-4">Detalles de la dieta cetogénica</h2>
      <form
        action={async (fd) => {
          startTransition(async () => {
            await saveAction(fd);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
          });
        }}
        className="flex-1 overflow-y-auto space-y-4"
      >
        <input type="hidden" name="patientId" value={patientId} />

        <div className="grid gap-3 sm:grid-cols-2">
          <F label="Tipo de dieta" name="dietType" defaultValue={data?.dietType} placeholder="Clásica, MCT, etc." />
          <F label="Relación cetogénica" name="ketogenicRatio" defaultValue={data?.ketogenicRatio} placeholder="Ej: 4:1" />
        </div>
        <F
          label="Fórmula cetogénica (gramos específicos, si aplica)"
          name="ketogenicFormula"
          textarea
          defaultValue={data?.ketogenicFormula}
          placeholder="Ej: 60g grasa, 15g proteína, 5g carbohidrato por comida"
        />

        <section className="rounded-xl border border-red-100 bg-red-50/40 p-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-red-600 mb-2">
            🚫 Restricciones alimentarias
          </p>
          <ul className="text-xs text-zinc-600 space-y-1 mb-3 list-none">
            {[
              "Azúcar, panela, miel de abejas",
              "Jugos de frutas (con o sin azúcar)",
              "Bebidas azucaradas y jarabes",
              "Frutas deshidratadas, postres, panadería con azúcar",
            ].map((r) => (
              <li key={r} className="flex items-start gap-1.5">
                <span className="text-red-400 mt-0.5">✕</span> {r}
              </li>
            ))}
          </ul>
          <F
            label="Otras restricciones indicadas por el nutricionista"
            name="dietRestrictions"
            textarea
            defaultValue={data?.dietRestrictions}
            placeholder="Anota aquí restricciones específicas..."
          />
        </section>

        <div className="rounded-xl border border-brand/20 bg-brand/5 p-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-brand mb-1">
            Recordatorio
          </p>
          <p className="text-xs text-zinc-600 leading-relaxed italic">
            "La terapia cetogénica es un tratamiento para la epilepsia refractaria y otras
            enfermedades, que se programa con un alto contenido de grasas, proteínas adecuadas
            para la edad del paciente y una mínima cantidad de hidratos de carbono."
          </p>
        </div>

        <SaveBtn pending={pending} saved={saved} />
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* HOJA 7 — Instrucciones médicas                                        */
/* ------------------------------------------------------------------ */
function Hoja7({
  data,
  patientId,
  saveAction,
  readOnly = false,
}: {
  data: Pasaporte | null;
  patientId: string;
  saveAction: (fd: FormData) => Promise<void>;
  readOnly?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <div className="flex flex-col h-full px-8 py-6">
      <PageHeader number={7} title="Instrucciones médicas" />
      {readOnly && (
        <div className="mb-4 rounded-xl px-4 py-3 text-xs text-brand font-medium"
          style={{ background: "var(--brand-light)", border: "1px solid #f3d0e3" }}>
          🔒 Esta sección es administrada por el equipo médico de Helse Colombia.
        </div>
      )}
      <h2 className="text-xl font-bold text-brand mb-1">⚠️ Atención</h2>
      <p className="text-xs text-zinc-400 mb-4">Instrucciones para el personal médico en urgencias.</p>

      <div className="flex-1 overflow-y-auto space-y-4">
        <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4">
          <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-2">
            Paciente en terapia cetogénica
          </p>
          <ul className="text-xs text-red-700 space-y-1.5">
            {[
              "Evitar soluciones IV con glucosa / dextrosa.",
              "No suspender bruscamente la terapia.",
              "Ante glucemias < 40 mg/dl sin síntomas: suministrar 20 ml de jugo de naranja vía oral.",
              "Con síntomas: suministrar perfusión de dextrosa al 5% de 4 ml/kg/hora.",
            ].map((item) => (
              <li key={item} className="flex items-start gap-1.5">
                <span className="mt-0.5 shrink-0">•</span> {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-xs font-bold text-zinc-600 uppercase tracking-wide mb-2">
            Otros cuidados
          </p>
          <ul className="text-xs text-zinc-600 space-y-1.5">
            {[
              "No ofrecer golosinas, gaseosas o jarabes.",
              "Consultar al médico sobre soluciones de rehidratación oral.",
              "Medicación preferiblemente en comprimidos, no jarabes.",
            ].map((item) => (
              <li key={item} className="flex items-start gap-1.5">
                <span className="mt-0.5 shrink-0">•</span> {item}
              </li>
            ))}
          </ul>
        </div>

        <form
          action={async (fd) => {
            startTransition(async () => {
              await saveAction(fd);
              setSaved(true);
              setTimeout(() => setSaved(false), 3000);
            });
          }}
          className="space-y-3"
        >
          <input type="hidden" name="patientId" value={patientId} />
          <div className="grid gap-3 sm:grid-cols-2">
            <F label="Máximo de glucosa diaria permitida" name="maxDailyGlucose" defaultValue={data?.maxDailyGlucose} placeholder="Ej: 150 mg/dl" />
            <F label="Teléfono de consulta" name="contactPhone" defaultValue={data?.contactPhone} placeholder="+57..." />
            <F label="Correo de consulta" name="contactEmail" type="email" defaultValue={data?.contactEmail} />
          </div>
          <F label="Notas médicas adicionales" name="medicalNotes" textarea defaultValue={data?.medicalNotes} />
          <SaveBtn pending={pending} saved={saved} />
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* HOJA 8 — Tabla de registro diario                                     */
/* ------------------------------------------------------------------ */
/* Muestra el valor numérico — rojo si > 0, gris si 0 o vacío */
function NumCell({ v }: { v: string | null | undefined }) {
  if (!v && v !== "0") return <span className="text-zinc-300">—</span>;
  const n = parseFloat(v ?? "");
  const isAlert = !isNaN(n) && n > 0;
  return <span className={isAlert ? "text-red-600 font-bold" : "text-zinc-400"}>{v}</span>;
}

/* Muestra Sí/No — rojo si Sí */
function YNCell({ v }: { v: string | null | undefined }) {
  if (!v) return <span className="text-zinc-300">—</span>;
  return v.toUpperCase() === "SI"
    ? <span className="text-red-600 font-bold">Sí</span>
    : <span className="text-zinc-400">No</span>;
}

function Hoja8({ surveys }: { surveys: SurveyForTable[] }) {
  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const bySurvey = surveys.reduce<Record<string, Record<string, SurveyForTable>>>(
    (acc, s) => {
      if (!s.localDate.startsWith(filterMonth)) return acc;
      if (!acc[s.localDate]) acc[s.localDate] = {};
      acc[s.localDate][s.slot] = s;
      return acc;
    },
    {},
  );

  function isAlert(s: SurveyForTable) {
    const numAlert = ["vomitos","diarrea","fiebre","numeroCrisis"].some((k) => {
      const n = parseFloat((s[k as keyof SurveyForTable] as string) ?? "");
      return !isNaN(n) && n > 0;
    });
    const ynAlert = ["transgresionDieta","cambioFae"].some(
      (k) => (s[k as keyof SurveyForTable] as string)?.toUpperCase() === "SI"
    );
    return numAlert || ynAlert;
  }

  return (
    <div className="flex flex-col h-full px-4 py-6">
      <PageHeader number={8} title="Registro diario" />
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-brand">Tabla de Registro Diario</h2>
        <input
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="rounded-lg border border-pink-200 bg-white px-2 py-1 text-xs"
        />
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-[10px] border-collapse">
          <thead>
            <tr className="bg-brand text-white">
              <th className="border border-brand-dark px-1 py-1.5 text-left">Día</th>
              <th className="border border-brand-dark px-1 py-1.5">Turno</th>
              <th className="border border-brand-dark px-1 py-1.5">Crisis</th>
              <th className="border border-brand-dark px-1 py-1.5">Vómitos</th>
              <th className="border border-brand-dark px-1 py-1.5">Diarrea</th>
              <th className="border border-brand-dark px-1 py-1.5">Fiebre</th>
              <th className="border border-brand-dark px-1 py-1.5">Temp°C</th>
              <th className="border border-brand-dark px-1 py-1.5">Glucosa</th>
              <th className="border border-brand-dark px-1 py-1.5">Cetonas</th>
              <th className="border border-brand-dark px-1 py-1.5">T.dieta</th>
              <th className="border border-brand-dark px-1 py-1.5">FAE</th>
              <th className="border border-brand-dark px-1 py-1.5 text-left">Obs.</th>
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day) => {
              const dateStr = `${filterMonth}-${String(day).padStart(2, "0")}`;
              const slots = ["MANANA", "MEDIODIA", "TARDE"];
              return slots.map((slot, si) => {
                const s = bySurvey[dateStr]?.[slot];
                const isFirst = si === 0;
                const alert = s && isAlert(s);

                return (
                  <tr
                    key={`${day}-${slot}`}
                    className={alert ? "bg-red-50" : si % 2 === 0 ? "bg-white" : "bg-pink-50/30"}
                  >
                    {isFirst && (
                      <td rowSpan={3} className="border border-pink-100 px-1 py-1 text-center font-bold text-brand align-middle">
                        {day}
                      </td>
                    )}
                    <td className="border border-pink-100 px-1 py-0.5 text-center text-zinc-500">
                      {SLOT_SHORT[slot]}
                    </td>
                    <td className="border border-pink-100 px-1 py-0.5 text-center">
                      <NumCell v={s?.numeroCrisis} />
                    </td>
                    <td className="border border-pink-100 px-1 py-0.5 text-center">
                      <NumCell v={s?.vomitos} />
                    </td>
                    <td className="border border-pink-100 px-1 py-0.5 text-center">
                      <NumCell v={s?.diarrea} />
                    </td>
                    <td className="border border-pink-100 px-1 py-0.5 text-center">
                      <NumCell v={s?.fiebre} />
                    </td>
                    <td className="border border-pink-100 px-1 py-0.5 text-center">
                      <NumCell v={s?.temperaturaFiebre} />
                    </td>
                    <td className="border border-pink-100 px-1 py-0.5 text-center">
                      <NumCell v={s?.glucosa} />
                    </td>
                    <td className="border border-pink-100 px-1 py-0.5 text-center">
                      <NumCell v={s?.cetonas} />
                    </td>
                    <td className="border border-pink-100 px-1 py-0.5 text-center">
                      <YNCell v={s?.transgresionDieta} />
                    </td>
                    <td className="border border-pink-100 px-1 py-0.5 text-center">
                      <YNCell v={s?.cambioFae} />
                    </td>
                    {isFirst && (
                      <td rowSpan={3} className="border border-pink-100 px-1 py-1 text-zinc-500 align-top max-w-[80px]">
                        {slots.map((sl) => bySurvey[dateStr]?.[sl]?.observaciones).filter(Boolean).join(" / ")}
                      </td>
                    )}
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
        <p className="mt-2 text-[9px] text-zinc-400 leading-relaxed px-1">
          * M = Mañana · MD = Mediodía · T = Tarde · Los números en rojo indican valor positivo o mayor a 0. Temp°C = temperatura de fiebre registrada.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* COMPONENTE PRINCIPAL — PasaporteBook con animación de paso de hoja   */
/* ------------------------------------------------------------------ */
const PAGE_LABELS = [
  "Portada", "Propósito", "Familias", "Info clave",
  "Medicamentos", "Dieta", "Instrucciones", "Registro",
];

export function PasaporteBook({ patientId, patientName, pasaporte, saveAction, surveys, readOnlySheets = [] }: Props) {
  const [page, setPage] = useState(0);
  const [animClass, setAnimClass] = useState("tab-enter-right");
  const [pageKey, setPageKey] = useState(0);
  const TOTAL = 8;

  function goTo(next: number) {
    setAnimClass(next > page ? "tab-enter-right" : "tab-enter-left");
    setPageKey((k) => k + 1);
    setPage(next);
  }

  // Si la hoja es de solo lectura, se pasa una acción vacía
  function actionFor(sheetNumber: number) {
    return readOnlySheets.includes(sheetNumber) ? async () => {} : saveAction;
  }

  const pageContent = [
    <Hoja1 key="1" patientName={patientName} />,
    <Hoja2 key="2" />,
    <Hoja3 key="3" />,
    <Hoja4 key="4" data={pasaporte} patientId={patientId} saveAction={actionFor(4)} />,
    <Hoja5 key="5" data={pasaporte} patientId={patientId} saveAction={actionFor(5)} />,
    <Hoja6 key="6" data={pasaporte} patientId={patientId} saveAction={actionFor(6)} />,
    <Hoja7 key="7" data={pasaporte} patientId={patientId} saveAction={actionFor(7)}
      readOnly={readOnlySheets.includes(7)} />,
    <Hoja8 key="8" surveys={surveys} />,
  ];

  return (
    <div className="flex flex-col items-center w-full">
      {/* Libro neumórfico */}
      <div
        className="relative w-full max-w-2xl overflow-hidden"
        style={{
          borderRadius: "24px",
          boxShadow: "12px 12px 30px #c8b5c4, -12px -12px 30px #ffffff",
          background: "var(--background)",
          minHeight: "620px",
        }}
      >
        {/* Lomo del libro */}
        <div
          className="absolute left-0 top-0 bottom-0 w-4"
          style={{
            background: "linear-gradient(180deg, var(--brand), var(--brand-dark))",
            boxShadow: "inset -2px 0 6px rgba(0,0,0,0.15)",
          }}
        />

        {/* Contenido animado */}
        <div className="ml-4 flex flex-col" style={{ minHeight: "620px" }}>
          <div key={pageKey} className={`flex-1 overflow-hidden ${animClass}`} style={{ minHeight: "560px" }}>
            {pageContent[page]}
          </div>
          <Nav
            page={page}
            total={TOTAL}
            onPrev={() => goTo(Math.max(0, page - 1))}
            onNext={() => goTo(Math.min(TOTAL - 1, page + 1))}
          />
        </div>
      </div>

      {/* Índice rápido neumórfico */}
      <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-2xl">
        {PAGE_LABELS.map((label, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className="rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200"
            style={
              page === i
                ? {
                    background: "linear-gradient(135deg, var(--brand), var(--brand-dark))",
                    color: "white",
                    boxShadow: "3px 3px 8px #b01062, -2px -2px 5px #f3d0e3",
                  }
                : {
                    background: "var(--background)",
                    color: "var(--foreground)",
                    opacity: 0.6,
                    boxShadow: "var(--neu-shadow-sm)",
                  }
            }
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>
    </div>
  );
}
