import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        vivo: {
          purple: "#5B2A86",
          purpleDark: "#4A1F6F",
          purpleLight: "#7C3AED",
          accent: "#8B3FD8",
        },
      },
      boxShadow: {
        card: "0 1px 3px rgba(28, 12, 55, 0.08), 0 1px 2px rgba(28,12,55,0.06)",
      },
    },
  },
  plugins: [],
};
export default config;
