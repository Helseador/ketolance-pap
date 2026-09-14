import type { Metadata, Viewport } from "next";
import { AppShell } from "./app-shell";

export const metadata: Metadata = {
  title: "Ketolance PAP",
  description: "Programa de Apoyo a Pacientes · Helse Colombia",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ketolance",
  },
};

export const viewport: Viewport = {
  themeColor: "#c4126b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function AppPacientePage() {
  return <AppShell />;
}
