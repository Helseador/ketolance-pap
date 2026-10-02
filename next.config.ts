import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    // En producción el build no falla por errores de tipos
    // El type-check se corre localmente antes de hacer push
    ignoreBuildErrors: true,
  },

};

export default nextConfig;
