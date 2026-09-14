"use client";

import Link from "next/link";

type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  documentId: string;
  phone: string;
  diagnosis: string | null;
  ketolanceActive: boolean;
};

export function PatientCard({ p }: { p: Patient }) {
  return (
    <Link
      href={`/dashboard/pacientes/${p.id}`}
      className="block rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1"
      style={{
        boxShadow: "var(--neu-shadow)",
        background: "var(--card-raised)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow =
          "8px 8px 20px #c8b5c4, -8px -8px 20px #ffffff";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "var(--neu-shadow)";
      }}
    >
      {/* Avatar */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-11 h-11 rounded-2xl gradient-brand flex items-center justify-center text-white font-bold text-lg shrink-0"
          style={{ boxShadow: "3px 3px 8px #b01062, -2px -2px 6px #f3d0e3" }}
        >
          {p.firstName.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm truncate">
            {p.firstName} {p.lastName}
          </p>
          <p className="text-xs text-foreground/40 truncate">Doc. {p.documentId}</p>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-1.5 text-xs text-foreground/60">
        <p>📱 {p.phone}</p>
        {p.diagnosis && <p className="truncate">🏥 {p.diagnosis}</p>}
      </div>

      {/* Badges */}
      <div className="flex gap-2 mt-4">
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={
            p.ketolanceActive
              ? { background: "#d1fae5", color: "#065f46" }
              : { background: "#f3f4f6", color: "#6b7280" }
          }
        >
          {p.ketolanceActive ? "Ketolance ✓" : "Inactivo"}
        </span>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: "var(--brand-light)", color: "var(--brand-dark)" }}
        >
          Ver hoja →
        </span>
      </div>
    </Link>
  );
}
