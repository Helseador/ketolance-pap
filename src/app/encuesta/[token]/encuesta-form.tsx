"use client";

import { useState, useTransition } from "react";
import Image from "next/image";

type Props = {
  token: string;
  patientName: string;
  slot: "MANANA" | "MEDIODIA" | "TARDE";
  submitAction: (fd: FormData) => Promise<{ ok: boolean; patientName: string }>;
  onDone?: () => void;
};

const SLOT_LABEL = { MANANA: "Mañana ☀️", MEDIODIA: "Mediodía 🌤️", TARDE: "Tarde 🌙" };
const SLOT_GREETING = {
  MANANA:   "Buenos días 🌅",
  MEDIODIA: "Buenas tardes ☀️",
  TARDE:    "Buenas noches 🌙",
};

/* ------------------------------------------------------------------ */
/* Pasos del wizard                                                      */
/* ------------------------------------------------------------------ */
type Step = {
  id: string;
  label: string;
  emoji: string;
  type: "number" | "yesno" | "mood" | "textarea";
  question: string;
  hint?: string;
  onlyManana?: boolean;
  /** Si está definido, este paso solo aparece si answers[showIfKey] > 0 */
  showIfPositive?: string;
};

const STEPS: Step[] = [
  {
    id: "vomitos", label: "Vómitos", emoji: "🤢", type: "number",
    question: "¿Cuántos episodios de vómito tuvo en este turno?",
    hint: "Escribe 0 si no tuvo ninguno",
  },
  {
    id: "diarrea", label: "Diarrea", emoji: "🚽", type: "number",
    question: "¿Cuántos episodios de diarrea tuvo?",
    hint: "Escribe 0 si no tuvo ninguno",
  },
  {
    id: "fiebre", label: "Fiebre", emoji: "🌡️", type: "number",
    question: "¿Cuántos episodios de fiebre tuvo?",
    hint: "Escribe 0 si no tuvo ninguno",
  },
  {
    id: "temperaturaFiebre", label: "Temperatura", emoji: "🔴", type: "number",
    question: "¿Cuál fue la temperatura más alta registrada? (°C)",
    hint: "Ejemplo: 38.5 — solo si tuvo fiebre",
    showIfPositive: "fiebre",
  },
  {
    id: "numeroCrisis", label: "Crisis", emoji: "⚡", type: "number",
    question: "¿Cuántas crisis epilépticas tuvo en este turno?",
    hint: "Escribe 0 si no tuvo ninguna",
  },
  {
    id: "transgresionDieta", label: "Dieta", emoji: "🥗", type: "yesno",
    question: "¿Hubo transgresión de la dieta cetogénica?",
  },
  {
    id: "cambioFae", label: "FAE", emoji: "💊", type: "yesno",
    question: "¿Hubo algún cambio en los fármacos antiepilépticos (FAE)?",
  },
  {
    id: "glucosa", label: "Glucosa", emoji: "🩸", type: "number",
    question: "¿Cuál fue el nivel de glucosa? (mg/dl)",
    hint: "Escribe 0 si no midió",
  },
  {
    id: "cetonas", label: "Cetonas", emoji: "🧪", type: "number",
    question: "¿Cuál fue el nivel de cetonas?",
    hint: "Escribe 0 si no midió",
  },
  {
    id: "estadoAnimo", label: "Ánimo", emoji: "😊", type: "mood",
    question: "¿Cómo es el estado de ánimo del paciente?",
  },
  {
    id: "peso", label: "Peso", emoji: "⚖️", type: "number",
    question: "¿Cuál es el peso del paciente hoy? (kg)",
    hint: "Solo se pregunta en el turno de la mañana",
    onlyManana: true,
  },
  {
    id: "observaciones", label: "Notas", emoji: "📝", type: "textarea",
    question: "¿Alguna observación adicional para el equipo de nutrición?",
    hint: "Opcional — escribe 'No' si no hay nada que agregar",
  },
];

/* ------------------------------------------------------------------ */
/* Componente principal                                                  */
/* ------------------------------------------------------------------ */
export function EncuestaForm({ token, patientName, slot, submitAction, onDone }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const [current, setCurrent] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  // Filtra pasos según slot y respuestas anteriores (condicionales)
  function getActiveSteps(ans: Record<string, string>) {
    return STEPS.filter((s) => {
      if (s.onlyManana && slot !== "MANANA") return false;
      if (s.showIfPositive) {
        const val = parseFloat(ans[s.showIfPositive] ?? "0");
        if (isNaN(val) || val <= 0) return false;
      }
      return true;
    });
  }

  const activeSteps = getActiveSteps(answers);
  const totalSteps = activeSteps.length;
  const s = activeSteps[step];
  const progress = Math.round((step / totalSteps) * 100);

  function validate(): boolean {
    if (s.type === "number") {
      const n = parseFloat(current.replace(",", "."));
      if (current.trim() === "" || isNaN(n) || n < 0) {
        setError("Por favor escribe un número válido (0 o más).");
        return false;
      }
    }
    if (s.type === "yesno" && !current) {
      setError("Por favor elige Sí o No.");
      return false;
    }
    if (s.type === "mood" && !current) {
      setError("Por favor elige una opción.");
      return false;
    }
    return true;
  }

  function handleNext() {
    setError("");
    if (!validate()) return;

    const newAnswers = { ...answers, [s.id]: current };
    setAnswers(newAnswers);
    setCurrent("");

    // Recalcula pasos con las nuevas respuestas
    const nextSteps = getActiveSteps(newAnswers);
    const nextStep = step + 1;

    if (nextStep < nextSteps.length) {
      setStep(nextStep);
    } else {
      // Último paso — enviar
      const finalAnswers = newAnswers;
      const fd = new FormData();
      fd.append("token", token);
      fd.append("slotOverride", slot);
      Object.entries(finalAnswers).forEach(([k, v]) => fd.append(k, v));
        startTransition(async () => {
          await submitAction(fd);
          setDone(true);
          onDone?.();
        });
    }
  }

  function handleBack() {
    setError("");
    if (step > 0) {
      const prev = activeSteps[step - 1];
      setCurrent(answers[prev.id] ?? "");
      setStep((p) => p - 1);
    }
  }

  // Recalcula total con respuestas actuales para la barra de progreso
  const displayTotal = getActiveSteps({ ...answers, [s?.id ?? ""]: current }).length;

  // Pantalla de éxito
  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center"
        style={{ background: "var(--background)" }}>
        <div className="scale-in">
          <div className="text-7xl mb-6">✅</div>
          <h2 className="text-2xl font-bold text-brand mb-2">¡Gracias!</h2>
          <p className="text-sm text-foreground/60 leading-relaxed max-w-xs">
            La información de <strong>{patientName}</strong> fue registrada correctamente en su
            hoja de vida clínica.
          </p>
          <div className="mt-6 rounded-2xl px-6 py-4 text-sm text-foreground/50"
            style={{ boxShadow: "var(--neu-shadow-inset)" }}>
            El equipo de nutrición de Helse Colombia revisará los datos. 💗
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <div style={{ borderRadius: "12px", boxShadow: "var(--neu-shadow-sm)", padding: "4px", background: "var(--background)" }}>
            <Image src="/imagen-ketolance.jpg" alt="Ketolance" width={40} height={40} className="rounded-xl object-contain" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand/50">Ketolance PAP</p>
            <p className="text-sm font-bold leading-tight">{patientName}</p>
          </div>
          <span className="ml-auto text-xs font-semibold text-brand/60 rounded-full px-3 py-1"
            style={{ boxShadow: "var(--neu-shadow-sm)" }}>
            {SLOT_LABEL[slot]}
          </span>
        </div>

        {/* Barra de progreso */}
        <div className="rounded-full h-2 overflow-hidden" style={{ boxShadow: "var(--neu-shadow-inset)" }}>
          <div className="h-full rounded-full transition-all duration-500 gradient-brand"
            style={{ width: `${progress}%` }} />
        </div>
        <p className="text-[10px] text-foreground/40 font-medium mt-1 text-right">
          Pregunta {step + 1} de {totalSteps}
        </p>
      </div>

      {/* Tarjeta de pregunta */}
      <div className="flex-1 px-5 pb-4">
        <div key={s.id} className="tab-enter-right rounded-3xl p-6"
          style={{ boxShadow: "var(--neu-shadow)", background: "var(--card-raised)" }}>

          {/* Emoji + saludo en primera pregunta */}
          {step === 0 && (
            <p className="text-sm font-semibold text-brand/70 mb-3">
              {SLOT_GREETING[slot]}, por favor responda las siguientes preguntas sobre el estado de salud del paciente.
            </p>
          )}

          <div className="text-5xl mb-4">{s.emoji}</div>
          <h2 className="text-lg font-bold leading-snug mb-1">{s.question}</h2>
          {s.hint && <p className="text-xs text-foreground/40 mb-4">{s.hint}</p>}

          {/* Input según tipo */}
          {s.type === "number" && (
            <input
              type="number"
              min="0"
              step="0.1"
              value={current}
              onChange={(e) => { setCurrent(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleNext()}
              placeholder="0"
              autoFocus
              className="neu-input w-full text-center text-3xl font-bold py-4 mt-2"
              style={{ borderRadius: "16px" }}
            />
          )}

          {s.type === "yesno" && (
            <div className="grid grid-cols-2 gap-3 mt-4">
              {[["SI", "✅ Sí"], ["NO", "❌ No"]].map(([val, label]) => (
                <button key={val} onClick={() => { setCurrent(val); setError(""); }}
                  className="py-4 rounded-2xl text-base font-bold transition-all duration-200"
                  style={current === val
                    ? { background: "linear-gradient(135deg,var(--brand),var(--brand-dark))", color: "white", boxShadow: "4px 4px 10px #b01062,-2px -2px 6px #f3d0e3" }
                    : { boxShadow: "var(--neu-shadow)", background: "var(--background)" }
                  }>
                  {label}
                </button>
              ))}
            </div>
          )}

          {s.type === "mood" && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[["BIEN", "😊", "Bien"], ["REGULAR", "😐", "Regular"], ["MAL", "😔", "Mal"]].map(([val, emoji, label]) => (
                <button key={val} onClick={() => { setCurrent(val); setError(""); }}
                  className="py-4 rounded-2xl text-center transition-all duration-200"
                  style={current === val
                    ? { background: "linear-gradient(135deg,var(--brand),var(--brand-dark))", color: "white", boxShadow: "4px 4px 10px #b01062,-2px -2px 6px #f3d0e3" }
                    : { boxShadow: "var(--neu-shadow)", background: "var(--background)" }
                  }>
                  <div className="text-3xl">{emoji}</div>
                  <div className="text-xs font-bold mt-1">{label}</div>
                </button>
              ))}
            </div>
          )}

          {s.type === "textarea" && (
            <textarea
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="Escribe aquí... (o 'No' si no hay nada)"
              rows={4}
              autoFocus
              className="neu-input w-full px-4 py-3 text-sm mt-2"
              style={{ borderRadius: "16px" }}
            />
          )}

          {error && (
            <p className="mt-3 text-sm font-medium text-red-600 text-center">{error}</p>
          )}
        </div>
      </div>

      {/* Botones de navegación */}
      <div className="px-5 pb-8 flex gap-3">
        {step > 0 && (
          <button onClick={handleBack}
            className="flex-none px-5 py-4 rounded-2xl font-semibold text-sm text-foreground/60"
            style={{ boxShadow: "var(--neu-shadow)" }}>
            ← Atrás
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={pending}
          className="flex-1 py-4 rounded-2xl font-bold text-white text-base transition-all"
          style={{ background: "linear-gradient(135deg,var(--brand),var(--brand-dark))", boxShadow: "4px 4px 12px #b01062,-2px -2px 8px #f3d0e3" }}
        >
          {pending ? "Enviando…" : step < totalSteps - 1 ? "Siguiente →" : "Enviar encuesta ✅"}
        </button>
      </div>
    </div>
  );
}
