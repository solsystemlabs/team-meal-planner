import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Add Tailwind v4 plugin
  ],
  server: {
    port: 3000,
  },
});
