"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null);

  return (
    <form action={action} className="space-y-5">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-foreground/50 mb-2">
          Correo electrónico
        </label>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="correo@helsecolombia.com"
          className="neu-input w-full px-4 py-3 text-sm font-medium placeholder:text-foreground/30"
          style={{ borderRadius: "12px" }}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-foreground/50 mb-2">
          Contraseña
        </label>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="neu-input w-full px-4 py-3 text-sm font-medium placeholder:text-foreground/30"
          style={{ borderRadius: "12px" }}
        />
      </div>

      {state?.error && (
        <div
          className="px-4 py-3 text-sm font-medium text-red-700"
          style={{
            background: "#fff0f0",
            borderRadius: "12px",
            boxShadow: "inset 3px 3px 8px #f5c8c8, inset -3px -3px 8px #ffffff",
          }}
        >
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="neu-btn-brand w-full px-4 py-3 font-semibold text-sm mt-2"
        style={{ borderRadius: "12px" }}
      >
        {pending ? "Ingresando…" : "Ingresar →"}
      </button>
    </form>
  );
}
