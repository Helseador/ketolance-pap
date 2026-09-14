import Image from "next/image";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16 min-h-screen">
      {/* Blobs decorativos de fondo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, #e91e8c 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #c4126b 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #f3d0e3 0%, transparent 70%)" }}
        />
      </div>

      {/* Card principal neumórfica */}
      <div
        className="relative w-full max-w-md scale-in"
        style={{
          background: "var(--background)",
          boxShadow: "12px 12px 28px #d0bfcc, -12px -12px 28px #ffffff",
          borderRadius: "24px",
          padding: "2.5rem",
        }}
      >
        {/* Encabezado con logo */}
        <div className="flex flex-col items-center text-center mb-8">
          <div
            className="mb-4"
            style={{
              borderRadius: "20px",
              boxShadow: "6px 6px 16px #d0bfcc, -6px -6px 16px #ffffff",
              padding: "8px",
              background: "var(--background)",
            }}
          >
            <Image
              src="/imagen-ketolance.jpg"
              alt="Ketolance"
              width={72}
              height={72}
              className="rounded-2xl object-contain"
            />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand/50 mb-1">
            Helse Colombia
          </p>
          <h1 className="text-2xl font-bold">
            Ketolance <span className="text-gradient">PAP</span>
          </h1>
          <p className="mt-2 text-sm text-foreground/50 leading-relaxed">
            Programa de Apoyo a Pacientes.<br />
            Acceso para nutricionistas, empresa y superadmin.
          </p>
        </div>

        {/* Divisor */}
        <div
          className="h-px mb-6"
          style={{
            background: "linear-gradient(90deg, transparent, #d4b8cb, transparent)",
          }}
        />

        <LoginForm />
      </div>
    </main>
  );
}
