import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      keyframes: {
        mShimmer: {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(120%)" },
        },
      },
      animation: {
        mShimmer: "mShimmer 1.9s ease-in-out infinite",
      },
      backgroundImage: {
        "mcat-light":
          "radial-gradient(1200px 900px at 18% 0%, rgba(99,102,241,0.14), transparent 55%)," +
          "radial-gradient(900px 700px at 92% 12%, rgba(56,189,248,0.14), transparent 58%)," +
          "radial-gradient(900px 700px at 60% 92%, rgba(16,185,129,0.10), transparent 55%)," +
          "#f3f4f6",
        "mcat-dark":
          "radial-gradient(1200px 900px at 18% 0%, rgba(99,102,241,0.22), transparent 55%)," +
          "radial-gradient(900px 700px at 92% 12%, rgba(56,189,248,0.20), transparent 58%)," +
          "radial-gradient(900px 700px at 60% 92%, rgba(16,185,129,0.16), transparent 55%)," +
          "#0b1220",

        "mcard-light":
          "radial-gradient(800px 260px at 20% 0%, rgba(99,102,241,0.10), transparent 60%)," +
          "radial-gradient(700px 240px at 90% 0%, rgba(56,189,248,0.10), transparent 62%)," +
          "rgba(255, 255, 255, 0.94)",
        "mcard-dark":
          "radial-gradient(800px 260px at 20% 0%, rgba(99,102,241,0.18), transparent 60%)," +
          "radial-gradient(700px 240px at 90% 0%, rgba(56,189,248,0.16), transparent 62%)," +
          "rgba(15, 23, 42, 0.92)",

        "mcard-glow":
          "radial-gradient(520px 260px at 15% 0%, rgba(99,102,241,0.18), transparent 60%)," +
          "radial-gradient(520px 260px at 90% 10%, rgba(56,189,248,0.16), transparent 62%)",
      },
    },
  },
  plugins: [typography],
};
