import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17140F",
        paper: "#F4EFE5",
        orange: "#8F6213",
        muted: "#6B6254",
        line: "#95866F",
        blue: "#493B28",
      },
      boxShadow: {
        card: "0 18px 50px rgba(55, 42, 25, 0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
