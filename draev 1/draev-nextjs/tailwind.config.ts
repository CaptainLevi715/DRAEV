import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#990002",
        bgDeep: "#7A0002",
        panel: "#7E0000",
        panel2: "#650000",
        line: "rgba(255,255,255,0.18)",
        cream: "#F5EFE8",
        muted: "rgba(245,239,232,0.7)",
      },
      fontFamily: {
        display: ["var(--font-anton)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
