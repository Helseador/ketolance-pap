"use client";

import { useEffect } from "react";

export function SwRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/encuesta" })
        .then((reg) => console.log("[SW] registrado:", reg.scope))
        .catch((err) => console.warn("[SW] error:", err));
    }
  }, []);

  return null;
}
