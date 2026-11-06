/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: v("canvas"), // Void Canvas
        surface: v("surface"), // Graphite
        glass: v("glass"), // Frosted Glass (usar con /10)
        fg: v("fg"), // Bone
        fg2: v("fg2"), // Ash
        line: v("line"), // Hairline
        cta: v("cta"),
        "cta-fg": v("cta-fg"),
        violet: "#6b62f2", // Dusk Violet: solo en degradados / brillos
      },
      fontFamily: {
        dm: ["'DM Sans'", "ui-sans-serif", "system-ui", "sans-serif"],
        geist: ["Geist", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        caption: ["0.8125rem", { lineHeight: "1.5", letterSpacing: "0.33px" }],
        subheading: ["1.125rem", { lineHeight: "1.5" }],
        "heading-sm": ["1.5rem", { lineHeight: "1.33" }],
        heading: ["clamp(1.75rem,4vw,2.25rem)", { lineHeight: "1.11" }],
        display: ["clamp(2.625rem,7vw,4.5rem)", { lineHeight: "1", letterSpacing: "-0.035em" }],
      },
      borderRadius: { ui: "10px", nav: "19px", card: "1.5rem", large: "40px", panel: "42px" },
      keyframes: {
        "acc-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "acc-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "fade-up": { from: { opacity: "0", transform: "translateY(10px)" }, to: { opacity: "1", transform: "none" } },
      },
      animation: {
        "acc-down": "acc-down .25s ease-out",
        "acc-up": "acc-up .2s ease-out",
        "fade-up": "fade-up .35s ease-out",
      },
    },
  },
  plugins: [],
};
