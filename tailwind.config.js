/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        forest: "#05290C",
        sage: "#E6F2EF",
        surface: "#F5F5F7",
        success: "#056936",
        danger: "#EF4444",
        background: "oklch(1 0 0)", // White
        foreground: "oklch(0.2547 0.0545 124.54)", // Deep dark green text

        // Recovery Compass Palette
        primary: {
          DEFAULT: "oklch(0.2475 0.0661 146.79)", // Deep Forest
          foreground: "oklch(1 0 0)" // White
        },
        secondary: {
          DEFAULT: "oklch(0.9484 0.0251 149.08)", // Sage Glaze
          foreground: "oklch(0.2475 0.0661 146.79)" // Deep Forest Text
        },
        muted: {
          DEFAULT: "oklch(0.96 0.01 124)",
          foreground: "oklch(0.55 0.04 124)"
        },
        accent: {
          DEFAULT: "oklch(0.9484 0.0251 149.08)", // Sage Glaze
          foreground: "oklch(0.2475 0.0661 146.79)"
        },
        destructive: {
          DEFAULT: "oklch(0.6 0.15 25)",
          foreground: "oklch(0.98 0 0)"
        },
        border: "oklch(0.92 0.02 124)",
        input: "oklch(0.92 0.02 124)",
        ring: "oklch(0.2547 0.0545 124.54)",
      },
      fontFamily: {
        sans: ["Satoshi-Regular", "System"],
        serif: ["Erode-Regular", "Georgia"],
        satoshi: ["Satoshi-Regular", "System"],
        "satoshi-medium": ["Satoshi-Medium", "System"],
        "satoshi-bold": ["Satoshi-Bold", "System"],
        erode: ["Erode-Regular", "Georgia"],
        "erode-italic": ["Erode-Italic", "Georgia"],
        "erode-light": ["Erode-Light", "Georgia"],
        "erode-light-italic": ["Erode-LightItalic", "Georgia"],
        "erode-medium": ["Erode-Medium", "Georgia"],
        "erode-medium-italic": ["Erode-MediumItalic", "Georgia"],
        "erode-semibold": ["Erode-Semibold", "Georgia"],
        "erode-semibold-italic": ["Erode-SemiboldItalic", "Georgia"],
        "erode-bold": ["Erode-Bold", "Georgia"],
        "erode-bold-italic": ["Erode-BoldItalic", "Georgia"],
      }
    },
  },
  plugins: [],
}
