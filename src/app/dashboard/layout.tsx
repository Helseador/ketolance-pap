import Image from "next/image";
import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";
import { NavLink } from "./nav-link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  return (
    <div className="flex min-h-screen" style={{ background: "var(--background)" }}>
      {/* Sidebar neumórfico */}
      <aside
        className="flex w-64 flex-col px-5 py-6 shrink-0"
        style={{
          background: "var(--background)",
          boxShadow: "6px 0 20px #d4c2cf, -2px 0 8px #ffffff",
          zIndex: 10,
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="shrink-0"
            style={{
              borderRadius: "14px",
              boxShadow: "4px 4px 10px #d4c2cf, -4px -4px 10px #ffffff",
              padding: "4px",
              background: "var(--background)",
            }}
          >
            <Image
              src="/imagen-ketolance.jpg"
              alt="Ketolance"
              width={44}
              height={44}
              className="rounded-xl object-contain"
            />
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-gradient">
              Helse Colombia
            </p>
            <h1 className="text-sm font-bold leading-tight text-foreground">
              Ketolance <span className="text-gradient">PAP</span>
            </h1>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-2">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-brand/40 px-3 mb-1">
            Navegación
          </p>
          <NavLink href="/dashboard" icon="📊" label="Tablero" exact />
          <NavLink href="/dashboard/pacientes" icon="👥" label="Pacientes" />
          {session.role === "SUPERADMIN" && (
            <>
              <NavLink href="/dashboard/usuarios" icon="🔑" label="Usuarios" />
              <NavLink href="/dashboard/auditoria" icon="📋" label="Auditoría" />
            </>
          )}
        </nav>

        {/* Usuario */}
        <div
          className="mt-4 rounded-2xl px-4 py-3"
          style={{ boxShadow: "var(--neu-shadow-inset)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-white text-xs font-bold shrink-0"
            >
              {session.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{session.name}</p>
              <p className="text-[10px] text-brand/60 font-medium">{session.role}</p>
            </div>
          </div>
          <form action={logoutAction}>
            <button className="w-full text-xs text-brand/70 hover:text-brand font-medium transition-colors text-left">
              Cerrar sesión →
            </button>
          </form>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 fade-up">
          {children}
        </div>
      </main>
    </div>
  );
}
