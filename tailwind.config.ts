import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f5f3ff",
          500: "#8b5cf6",
          600: "#7c3aed",
        },
        secondary: {
          50: "#fdf2f8",
          500: "#ec4899",
          600: "#db2777",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
