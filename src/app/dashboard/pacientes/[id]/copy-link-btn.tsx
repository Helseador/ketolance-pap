"use client";

import { useState } from "react";

export function CopyLinkBtn({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    // La app del paciente — entra por documento, no por token
    const url = `${window.location.origin}/app-paciente`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all"
      style={
        copied
          ? { background: "#d1fae5", color: "#065f46", boxShadow: "var(--neu-shadow-inset)" }
          : { background: "var(--background)", boxShadow: "var(--neu-shadow-sm)", color: "var(--brand)" }
      }
    >
      {copied ? "✅ Link copiado" : "🔗 Copiar link de encuesta"}
    </button>
  );
}
