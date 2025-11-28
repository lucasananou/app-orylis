import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1280px"
      }
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        accent: {
          DEFAULT: "#0D69FF",
          foreground: "#FFFFFF"
        },
        primary: {
          DEFAULT: "#0D69FF",
          foreground: "#FFFFFF"
        },
        secondary: {
          DEFAULT: "hsl(213 27% 95%)",
          foreground: "#0f172a"
        },
        muted: {
          DEFAULT: "hsl(214 32% 94%)",
          foreground: "hsl(215 20% 32%)"
        },
        destructive: {
          DEFAULT: "hsl(0 84% 60%)",
          foreground: "#FFFFFF"
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        }
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem"
      },
      fontFamily: {
        sans: ["var(--font-inter)", ...fontFamily.sans],
        poppins: ["var(--font-poppins)", ...fontFamily.sans]
      },
      boxShadow: {
        subtle: "0 10px 30px -25px rgba(15, 23, 42, 0.4)"
      }
    }
  },
  plugins: [animate]
};

export default config;

