/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "oklch(0.9851 0 0)", // #FAFAFA
        foreground: "oklch(0.276 0.0233 248.68)", // #1F2933

        primary: {
          DEFAULT: "oklch(0.536 0.0821 175.29)",  // #2E7D6B
          foreground: "oklch(0.99 0.01 100)"
        },
        secondary: {
          DEFAULT: "oklch(0.9513 0.0133 179.46)",  // #E6F2EF
          foreground: "oklch(0.25 0.04 250)"
        },
        accent: {
          DEFAULT: "oklch(0.646 0.1423 253.92)",  // #4A90E2
          foreground: "oklch(0.99 0.01 100)"
        },
        destructive: {
          DEFAULT: "oklch(0.7686 0.1647 70.08)", // #F59E0B
          foreground: "oklch(0.99 0.01 100)"
        },
        muted: {
          DEFAULT: "oklch(0.96 0.01 100)",
          foreground: "oklch(0.551 0.0234 264.36)" // #6B7280
        },
        card: {
          DEFAULT: "oklch(0.99 0.00 100)",
          foreground: "oklch(0.25 0.04 250)"
        },
        border: "oklch(0.92 0.02 95)",
        input: "oklch(0.92 0.02 95)",
        ring: "oklch(0.55 0.11 170)",
      },
      fontFamily: {
        sans: ["Inter_400Regular"],
        serif: ["PlayfairDisplay_700Bold"],
      }
    },
  },
  plugins: [],
}
