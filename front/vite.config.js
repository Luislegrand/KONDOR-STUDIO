import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  },
  define: {
    // Garante que a API URL esteja disponível no frontend em tempo de build:
    // - VITE_API_URL (principal)
    "import.meta.env.VITE_API_URL": JSON.stringify(process.env.VITE_API_URL)
  },
  build: {
    outDir: "dist",
    sourcemap: false
  },
  server: {
    port: 5173,
    strictPort: true
  },
  preview: {
    port: 4173,
    strictPort: true
  }
});
