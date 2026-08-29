import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // La raiz es el repo, no esta carpeta: el front importa el codegen de
    // Convex desde ../convex/_generated con el alias @convex/*. Con la raiz
    // en frogl-frontend, Turbopack lo ve fuera del proyecto y no lo resuelve.
    root: path.resolve(__dirname, ".."),
  },
};

export default nextConfig;
