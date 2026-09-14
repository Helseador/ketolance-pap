"use client";

import Image from "next/image";

export default function OfflinePage() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen px-6 text-center"
      style={{ background: "var(--background)" }}
    >
      <div className="scale-in">
        <div
          className="mb-6 mx-auto"
          style={{
            borderRadius: "20px",
            boxShadow: "6px 6px 16px #d0bfcc, -6px -6px 16px #ffffff",
            padding: "10px",
            background: "var(--background)",
            width: "fit-content",
          }}
        >
          <Image
            src="/imagen-ketolance.jpg"
            alt="Ketolance"
            width={80}
            height={80}
            className="rounded-2xl object-contain"
          />
        </div>
        <div className="text-5xl mb-4">📡</div>
        <h1 className="text-xl font-bold text-brand mb-2">Sin conexión</h1>
        <p className="text-sm text-foreground/60 leading-relaxed max-w-xs">
          No hay conexión a internet. Por favor conéctate a WiFi o datos móviles y vuelve a intentarlo.
        </p>
        <div
          className="mt-6 rounded-2xl px-6 py-4 text-sm text-foreground/50"
          style={{ boxShadow: "var(--neu-shadow-inset)" }}
        >
          <p className="font-semibold text-brand mb-1">Ketolance PAP</p>
          <p className="text-xs">Helse Colombia · Programa de Apoyo a Pacientes</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 neu-btn-brand px-6 py-3 text-sm font-semibold rounded-xl"
          style={{ borderRadius: "14px" }}
        >
          Reintentar →
        </button>
      </div>
    </div>
  );
}
