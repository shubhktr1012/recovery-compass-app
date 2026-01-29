/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "oklch(0.98 0.01 100)", // Warm Cream
        foreground: "oklch(0.25 0.02 50)",  // Deep Charcoal

        primary: {
          DEFAULT: "oklch(0.45 0.1 140)",   // Forest Green
          foreground: "oklch(0.99 0.02 100)"
        },
        secondary: {
          DEFAULT: "oklch(0.95 0.04 95)",   // Soft Sand
          foreground: "oklch(0.35 0.05 140)"
        },
        accent: {
          DEFAULT: "oklch(0.94 0.05 130)",  // Green Tea
          foreground: "oklch(0.30 0.05 140)"
        },
        muted: {
          DEFAULT: "oklch(0.96 0.01 100)",
          foreground: "oklch(0.55 0.02 80)"
        },
        card: {
          DEFAULT: "oklch(0.995 0.005 100)",
          foreground: "oklch(0.25 0.02 50)"
        },
        border: "oklch(0.92 0.02 95)",
        input: "oklch(0.92 0.02 95)",
        ring: "oklch(0.45 0.1 140)",
      },
      fontFamily: {
        sans: ["Inter_400Regular"],
        serif: ["PlayfairDisplay_700Bold"],
      }
    },
  },
  plugins: [],
}
