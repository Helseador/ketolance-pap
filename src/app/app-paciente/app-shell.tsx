"use client";

import Image from "next/image";
import { useState, useEffect, useTransition } from "react";
import { loginByDocument, submitEncuesta, getPasaporteByPatientId } from "@/app/actions/encuesta";
import { savePasaportePublico } from "@/app/actions/pasaporte";
import { EncuestaForm } from "@/app/encuesta/[token]/encuesta-form";
import { PasaporteBook } from "@/app/dashboard/pacientes/[id]/pasaporte/pasaporte-book";

/* ------------------------------------------------------------------ */
/* Tipos                                                                 */
/* ------------------------------------------------------------------ */
type PatientSession = Awaited<ReturnType<typeof loginByDocument>>;
type Screen = "splash" | "login" | "welcome" | "encuesta" | "pasaporte";

const SLOT_LABEL: Record<string, string> = {
  MANANA: "Mañana ☀️ (8:00)",
  MEDIODIA: "Mediodía 🌤️ (12:00)",
  TARDE: "Tarde 🌙 (16:00)",
};

const FRASES = [
  "Cada día registrado es un paso más hacia el bienestar. 💗",
  "Tu constancia es el mejor medicamento. 🌱",
  "El amor con el que cuidas es parte del tratamiento. 🤍",
  "Pequeños datos, grandes decisiones médicas. 🩺",
  "Gracias por estar aquí, por cuidar con tanto amor. 🌸",
  "La dieta cetogénica es un camino de paciencia y dedicación. ✨",
  "Cada respuesta ayuda al equipo médico a cuidarlos mejor. 💪",
];

function fraseDelDia() {
  const idx = new Date().getDate() % FRASES.length;
  return FRASES[idx];
}

function currentSlot(): "MANANA" | "MEDIODIA" | "TARDE" {
  const h = new Date().getHours();
  if (h < 12) return "MANANA";
  if (h < 16) return "MEDIODIA";
  return "TARDE";
}

/* ------------------------------------------------------------------ */
/* SPLASH SCREEN                                                         */
/* ------------------------------------------------------------------ */
function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 5000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ background: "linear-gradient(160deg, #8c0d4e 0%, #c4126b 50%, #e91e8c 100%)" }}
    >
      {/* Círculos decorativos */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, #ffffff 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
      <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-15"
        style={{ background: "radial-gradient(circle, #ffffff 0%, transparent 70%)", transform: "translate(-30%, 30%)" }} />

      {/* Logos */}
      <div className="scale-in flex flex-col items-center gap-4 relative z-10">
        {/* Video de Ketolito — solo en el splash */}
        <div style={{
          borderRadius: "40px",
          overflow: "hidden",
          boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 60%, transparent 100%)",
          maskImage: "radial-gradient(ellipse at center, black 60%, transparent 100%)",
        }}>
          <video
            src="/ketolito.mp4"
            autoPlay
            loop
            muted
            playsInline
            style={{ width: "220px", height: "220px", objectFit: "contain", display: "block" }}
          />
        </div>

        <div className="text-center">
          <p className="text-white/70 text-xs font-bold uppercase tracking-[0.3em] mb-3">Helse Colombia</p>
          <div className="rounded-2xl overflow-hidden mx-auto px-4 py-2"
            style={{ background: "rgba(255,255,255,0.95)", display: "inline-block" }}>
            <Image
              src="/logo-ketolance.png"
              alt="Ketolance"
              width={200}
              height={80}
              className="object-contain"
            />
          </div>
          <p className="text-white/80 text-sm mt-3">Programa de Apoyo a Pacientes</p>
        </div>

        {/* Logos secundarios */}
        <div className="flex items-center gap-4 mt-2">
          <div className="h-px w-12 bg-white/30" />
          <p className="text-white/50 text-[10px] uppercase tracking-widest">Nutrigénomica</p>
          <div className="h-px w-12 bg-white/30" />
        </div>

        {/* Loader */}
        <div className="mt-4 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-white/60"
              style={{ animation: `bounce 1s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.6; }
          50% { transform: translateY(-8px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* LOGIN                                                                 */
/* ------------------------------------------------------------------ */
function LoginScreen({ onLogin }: { onLogin: (p: NonNullable<PatientSession>) => void }) {
  const [doc, setDoc] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    if (!doc.trim()) { setError("Por favor escribe el número de documento."); return; }
    setError("");
    startTransition(async () => {
      const patient = await loginByDocument(doc);
      if (!patient) {
        setError("Documento no encontrado. Verifica el número o contacta a tu nutricionista.");
        return;
      }
      onLogin(patient);
    });
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--background)" }}>
      {/* Header curvo */}
      <div className="relative pb-12 px-6 pt-12 text-center"
        style={{ background: "linear-gradient(160deg, #8c0d4e, #c4126b)", borderRadius: "0 0 40px 40px" }}>
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)", transform: "translate(20%,-20%)" }} />

        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="rounded-2xl overflow-hidden shadow-xl"
            style={{ border: "2px solid rgba(255,255,255,0.4)" }}>
            <Image src="/imagen-ketolance.jpg" alt="Ketolance" width={72} height={72} className="object-contain" />
          </div>
          <div>
            <p className="text-white/70 text-[10px] font-bold uppercase tracking-[0.25em]">Helse Colombia</p>
            <h1 className="text-white text-2xl font-bold">Ketolance PAP</h1>
          </div>
        </div>
      </div>

      {/* Card de login */}
      <div className="flex-1 px-6 -mt-6 relative z-10">
        <div className="rounded-3xl p-6" style={{ boxShadow: "var(--neu-shadow)", background: "var(--card-raised)" }}>
          <h2 className="text-lg font-bold mb-1">¡Bienvenido! 👋</h2>
          <p className="text-sm text-foreground/50 mb-6 leading-relaxed">
            Para ingresar, escribe el número de documento del paciente.
          </p>

          <label className="block text-xs font-bold uppercase tracking-wide text-foreground/40 mb-2">
            Número de documento
          </label>
          <input
            type="number"
            value={doc}
            onChange={(e) => { setDoc(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Ej: 1000000001"
            className="neu-input w-full text-center text-xl font-bold py-4"
            style={{ borderRadius: "16px" }}
            autoFocus
          />

          {error && (
            <div className="mt-3 rounded-2xl px-4 py-3 text-sm text-red-700 text-center"
              style={{ background: "#fff0f0", boxShadow: "inset 3px 3px 8px #f5c8c8, inset -3px -3px 8px #fff" }}>
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={pending}
            className="mt-5 w-full py-4 rounded-2xl font-bold text-white text-base"
            style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-dark))", boxShadow: "4px 4px 14px #b01062, -2px -2px 8px #f3d0e3" }}
          >
            {pending ? "Verificando…" : "Ingresar →"}
          </button>
        </div>

        {/* Logos footer */}
        <div className="flex items-center justify-center gap-4 mt-8 opacity-40">
          <Image src="/imagen-ketolance.jpg" alt="Ketolance" width={28} height={28} className="rounded-lg object-contain" />
          <div className="h-4 w-px bg-foreground/30" />
          <p className="text-xs font-bold uppercase tracking-widest">Nutrigénomica</p>
          <div className="h-4 w-px bg-foreground/30" />
          <p className="text-xs font-bold uppercase tracking-widest">Helse</p>
        </div>

        <p className="text-center text-[10px] text-foreground/30 mt-4">
          Programa de Apoyo a Pacientes · Ketolance · Helse Colombia
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* CARRUSEL DE IMÁGENES                                                  */
/* ------------------------------------------------------------------ */
const CAROUSEL_IMAGES = [
  { src: "/logo-ketolance.png",  alt: "Logo Ketolance" },
  { src: "/ketolito-color.png",  alt: "Ketolito" },
  { src: "/logo-helse.jpg",      alt: "Logo Helse Colombia" },
];

function ImageCarousel() {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setCurrent((c) => (c + 1) % CAROUSEL_IMAGES.length);
        setFading(false);
      }, 400);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const img = CAROUSEL_IMAGES[current];

  return (
    <div className="rounded-3xl overflow-hidden scale-in"
      style={{ boxShadow: "var(--neu-shadow)", background: "var(--card-raised)" }}>
      <div className="relative flex items-center justify-center px-6 py-5"
        style={{ minHeight: "160px" }}>
        <Image
          key={current}
          src={img.src}
          alt={img.alt}
          width={260}
          height={140}
          className="object-contain transition-opacity duration-400"
          style={{ opacity: fading ? 0 : 1, maxHeight: "140px", transition: "opacity 0.4s ease" }}
        />
      </div>
      {/* Puntos indicadores */}
      <div className="flex justify-center gap-1.5 pb-3">
        {CAROUSEL_IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === current ? "20px" : "6px",
              height: "6px",
              background: i === current ? "var(--brand)" : "#d4b8cb",
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* BIENVENIDA                                                            */
/* ------------------------------------------------------------------ */
function WelcomeScreen({
  patient,
  onStart,
  onLogout,
  onPasaporte,
}: {
  patient: NonNullable<PatientSession>;
  onStart: () => void;
  onLogout: () => void;
  onPasaporte: () => void;
}) {
  const slot = currentSlot();
  const greeting = slot === "MANANA" ? "Buenos días" : slot === "MEDIODIA" ? "Buenas tardes" : "Buenas noches";
  const firstName = patient.firstName.split(" ")[0];
  const frase = fraseDelDia();
  const pct = patient.stats.total > 0
    ? Math.round((patient.stats.completed / patient.stats.total) * 100)
    : 0;
  const hasEncuestaPendiente = patient.nextSlot !== null;

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="relative px-6 pt-10 pb-16 text-center"
        style={{ background: "linear-gradient(160deg, #8c0d4e, #c4126b)", borderRadius: "0 0 48px 48px" }}>
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle,#fff 0%,transparent 70%)", transform: "translate(20%,-20%)" }} />

        <button onClick={onLogout} className="absolute top-4 right-5 text-white/50 text-xs font-medium">
          Salir
        </button>

        <div className="relative z-10">
          {/* Avatar inicial */}
          <div className="w-20 h-20 rounded-3xl mx-auto mb-3 flex items-center justify-center text-3xl font-bold text-white shadow-xl"
            style={{ background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.4)" }}>
            {firstName.charAt(0)}
          </div>
          <p className="text-white/70 text-sm">{greeting} 👋</p>
          <h1 className="text-white text-2xl font-bold mt-0.5">{firstName}</h1>
          <p className="text-white/60 text-xs mt-1">{patient.firstName} {patient.lastName}</p>
        </div>
      </div>

      <div className="flex-1 px-5 -mt-8 space-y-4 pb-8">
        {/* Carrusel de imágenes */}
        <ImageCarousel />

        {/* Bienvenida al pasaporte */}
        <div className="rounded-3xl p-5" style={{ background: "linear-gradient(135deg, #8c0d4e, #c4126b)", boxShadow: "6px 6px 20px #b01062, -3px -3px 10px #f3d0e3" }}>
          <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-1">✨ Bienvenido a</p>
          <h2 className="text-white text-xl font-bold leading-tight">Mi Pasaporte Keto</h2>
          <p className="text-white/70 text-xs mt-2 leading-relaxed">
            Este es tu espacio de seguimiento diario, {firstName}. Aquí registramos tu salud para que el equipo de nutrición de Helse Colombia pueda cuidarte mejor.
          </p>
          <div className="mt-3 h-px bg-white/20" />
          <p className="text-white/50 text-[10px] mt-3 italic">
            "Cuidándome con amor y constancia 💗"
          </p>
        </div>

        {/* Frase del día */}
        <div className="rounded-3xl p-5" style={{ boxShadow: "var(--neu-shadow)", background: "var(--card-raised)" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand/50 mb-2">💗 Frase del día</p>
          <p className="text-sm font-medium text-foreground/70 leading-relaxed italic">{frase}</p>
        </div>

        {/* Próxima encuesta */}
        {hasEncuestaPendiente ? (
          <div className="rounded-3xl p-5" style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-dark))", boxShadow: "6px 6px 20px #b01062, -3px -3px 10px #f3d0e3" }}>
            <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-1">Encuesta pendiente</p>
            <p className="text-white text-lg font-bold">{SLOT_LABEL[patient.nextSlot!]}</p>
            <p className="text-white/60 text-xs mt-1">Toca el botón para responder ahora</p>
            <button
              onClick={onStart}
              className="mt-4 w-full py-3.5 rounded-2xl font-bold text-brand text-sm"
              style={{ background: "white", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
            >
              Responder encuesta →
            </button>
          </div>
        ) : (
          <div className="rounded-3xl p-5" style={{ boxShadow: "var(--neu-shadow-inset)", background: "var(--background)" }}>
            <div className="text-center">
              <div className="text-4xl mb-2">✅</div>
              <p className="font-bold text-brand">¡Todo al día!</p>
              <p className="text-sm text-foreground/50 mt-1">No hay encuestas pendientes por ahora.</p>
              <p className="text-xs text-foreground/30 mt-1">La próxima llegará en el siguiente turno.</p>
            </div>
          </div>
        )}

        {/* Stats del mes */}
        <div className="rounded-3xl p-5" style={{ boxShadow: "var(--neu-shadow)", background: "var(--card-raised)" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 mb-3">📊 Este mes</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-2xl p-3 text-center" style={{ boxShadow: "var(--neu-shadow-inset)" }}>
              <p className="text-2xl font-bold text-brand">{patient.stats.completed}</p>
              <p className="text-[10px] text-foreground/40 uppercase tracking-wide mt-0.5">Completadas</p>
            </div>
            <div className="rounded-2xl p-3 text-center" style={{ boxShadow: "var(--neu-shadow-inset)" }}>
              <p className="text-2xl font-bold text-foreground/60">{patient.stats.total}</p>
              <p className="text-[10px] text-foreground/40 uppercase tracking-wide mt-0.5">Total</p>
            </div>
          </div>
          {/* Barra de progreso */}
          <div>
            <div className="flex justify-between text-[10px] text-foreground/40 mb-1">
              <span>Progreso del mes</span>
              <span>{pct}%</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ boxShadow: "var(--neu-shadow-inset)" }}>
              <div className="h-full rounded-full gradient-brand transition-all duration-700"
                style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        {/* Botón Pasaporte Keto */}
        <button
          onClick={onPasaporte}
          className="w-full rounded-3xl p-5 text-left transition-all"
          style={{ boxShadow: "var(--neu-shadow)", background: "var(--card-raised)" }}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
              style={{ boxShadow: "var(--neu-shadow-inset)" }}>
              📒
            </div>
            <div className="flex-1">
              <p className="font-bold text-brand text-sm">Mi Pasaporte Keto</p>
              <p className="text-xs text-foreground/50 mt-0.5">
                Ver tu historial, datos clínicos y registro diario
              </p>
            </div>
            <span className="text-brand text-lg">→</span>
          </div>
        </button>

        {/* Logos footer */}
        <div className="rounded-3xl p-4" style={{ boxShadow: "var(--neu-shadow-inset)" }}>
          <div className="flex items-center justify-center gap-4">
            <Image src="/imagen-ketolance.jpg" alt="Ketolance" width={32} height={32}
              className="rounded-xl object-contain opacity-70" />
            <div className="text-center">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-foreground/30">Helse Colombia</p>
              <p className="text-[9px] text-foreground/20">Programa de Apoyo a Pacientes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* PANTALLA PASAPORTE                                                    */
/* ------------------------------------------------------------------ */
type PasaporteData = Awaited<ReturnType<typeof getPasaporteByPatientId>>;

function PasaporteScreen({
  patient,
  data,
  onBack,
}: {
  patient: NonNullable<PatientSession>;
  data: PasaporteData;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-center gap-3 sticky top-0 z-10"
        style={{ background: "var(--background)", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-brand"
          style={{ boxShadow: "var(--neu-shadow-sm)", background: "var(--background)" }}
        >
          ←
        </button>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand/50">Mi</p>
          <h2 className="text-base font-bold leading-tight">Pasaporte Keto</h2>
        </div>
        <div className="ml-auto">
          <Image src="/logo-ketolance.png" alt="Ketolance" width={80} height={30}
            className="object-contain opacity-70" />
        </div>
      </div>

      {/* Pasaporte */}
      <div className="flex-1 px-3 pb-8 overflow-auto">
        <PasaporteBook
          patientId={patient.id}
          patientName={`${patient.firstName} ${patient.lastName}`}
          pasaporte={data.pasaporte}
          saveAction={savePasaportePublico}
          readOnlySheets={[7]}
          surveys={data.surveys.map((s) => ({
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
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SHELL PRINCIPAL                                                       */
/* ------------------------------------------------------------------ */
export function AppShell() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [patient, setPatient] = useState<NonNullable<PatientSession> | null>(null);
  const [pasaporteData, setPasaporteData] = useState<PasaporteData | null>(null);
  const [loadingPasaporte, startPasaporte] = useTransition();

  function handleLogin(p: NonNullable<PatientSession>) {
    setPatient(p);
    setScreen("welcome");
  }

  function handleLogout() {
    setPatient(null);
    setPasaporteData(null);
    setScreen("login");
  }

  function handleOpenPasaporte() {
    if (!patient) return;
    if (pasaporteData) { setScreen("pasaporte"); return; }
    startPasaporte(async () => {
      const data = await getPasaporteByPatientId(patient.id);
      setPasaporteData(data);
      setScreen("pasaporte");
    });
  }

  if (screen === "splash") {
    return <SplashScreen onDone={() => setScreen("login")} />;
  }

  if (screen === "login") {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (screen === "welcome" && patient) {
    return (
      <WelcomeScreen
        patient={patient}
        onStart={() => setScreen("encuesta")}
        onLogout={handleLogout}
        onPasaporte={handleOpenPasaporte}
      />
    );
  }

  if (screen === "encuesta" && patient?.surveyToken) {
    const slot = patient.nextSlot ?? currentSlot();
    return (
      <EncuestaForm
        token={patient.surveyToken}
        patientName={`${patient.firstName} ${patient.lastName}`}
        slot={slot as "MANANA" | "MEDIODIA" | "TARDE"}
        submitAction={submitEncuesta}
        onDone={() => {
          setScreen("welcome");
          setPatient((p) =>
            p ? { ...p, nextSlot: null, stats: { ...p.stats, completed: p.stats.completed + 1 } } : p
          );
        }}
      />
    );
  }

  if (screen === "pasaporte" && patient && pasaporteData) {
    return (
      <PasaporteScreen
        patient={patient}
        data={pasaporteData}
        onBack={() => setScreen("welcome")}
      />
    );
  }

  // Cargando pasaporte
  if (loadingPasaporte) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4"
        style={{ background: "var(--background)" }}>
        <div className="text-4xl">📒</div>
        <p className="text-sm font-semibold text-brand">Cargando tu pasaporte…</p>
        <div className="flex gap-1.5">
          {[0,1,2].map((i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-brand/40"
              style={{ animation: `bounce 1s ease-in-out ${i*0.2}s infinite` }} />
          ))}
        </div>
        <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}`}</style>
      </div>
    );
  }

  return null;
}
