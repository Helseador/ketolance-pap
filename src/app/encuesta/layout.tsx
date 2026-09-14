import type { Metadata, Viewport } from "next";
import { SwRegister } from "./sw-register";

export const metadata: Metadata = {
  title: "Ketolance PAP — Seguimiento",
  description: "Programa de Apoyo a Pacientes Ketolance · Helse Colombia",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ketolance",
    startupImage: "/icons/icon-512.png",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-128.png", sizes: "128x128" },
      { url: "/icons/icon-192.png", sizes: "192x192" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#c4126b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function EncuestaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SwRegister />
      {children}
    </>
  );
}
