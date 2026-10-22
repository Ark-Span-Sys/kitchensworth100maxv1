import type { Config } from "tailwindcss";

/**
 * Kitchen's Worth brand tokens.
 * Black #0B0B0B · Lime green #5CD15C · Warm yellow #F5D74A · Off-white #FAFAF7
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // Allow any whole-number alpha step 0–100 for color opacity modifiers
      // (default Tailwind scale is sparse: 0,5,10,20,25,…). Code uses /3, /8, /15 etc.
      opacity: Object.fromEntries(Array.from({ length: 101 }, (_, i) => [i, String(i / 100)])),
      colors: {
        brand: {
          black: "#0B0B0B",
          ink: "#141414",
          green: "#5CD15C",
          "green-dark": "#3FA23F",
          yellow: "#F5D74A",
          cream: "#FAFAF7",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "dock-bounce": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "ticker-scroll": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "dock-bounce": "dock-bounce 320ms ease-out",
        "ticker-scroll": "ticker-scroll 30s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
