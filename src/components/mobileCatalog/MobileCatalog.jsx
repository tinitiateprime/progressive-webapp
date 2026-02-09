"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FiMoon, FiSun, FiType } from "react-icons/fi";
import SubjectPager from "./SubjectPager";

function norm(s) {
  return String(s || "").toLowerCase().trim();
}

function prettySubject(subject) {
  return subject || "Subject";
}


function pickSubject(catalog, id) {
  const key = norm(id);
  return (catalog || []).find((x) => norm(x.subject) === key) || null;
}

/** ✅ 5 Google font options */
const FONT_OPTIONS = [
  {
    id: "inter",
    name: "Inter",
    css: `"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif`,
  },
  {
    id: "roboto",
    name: "Roboto",
    css: `"Roboto", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Arial, sans-serif`,
  },
  {
    id: "poppins",
    name: "Poppins",
    css: `"Poppins", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif`,
  },
  {
    id: "nunito",
    name: "Nunito",
    css: `"Nunito", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif`,
  },
  {
    id: "sourcesans",
    name: "Source Sans 3",
    css: `"Source Sans 3", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif`,
  },
];

export default function MobileCatalog({ catalog }) {
  const [active, setActive] = useState("vuejs");

  // ✅ theme + font (persist)
  const [theme, setTheme] = useState(() => localStorage.getItem("mcat_theme") || "light");
  const [fontId, setFontId] = useState(() => localStorage.getItem("mcat_font") || "inter");
  const [fontOpen, setFontOpen] = useState(false);

  const actionsRef = useRef(null);

  // ✅ Apply theme globally to <html> (this makes dark/light “total”)
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("mcat_theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("mcat_font", fontId);
  }, [fontId]);

  // close font menu on outside click + ESC
  useEffect(() => {
    const onDown = (e) => {
      if (!fontOpen) return;
      if (!actionsRef.current) return;
      if (!actionsRef.current.contains(e.target)) setFontOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setFontOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown, { passive: true });
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [fontOpen]);

  const vue = useMemo(() => pickSubject(catalog, "vuejs"), [catalog]);
  const next = useMemo(() => pickSubject(catalog, "nextjs"), [catalog]);
  const sql = useMemo(() => pickSubject(catalog, "sqlserver"), [catalog]);

  const tabs = useMemo(() => {
    return [
      vue && { id: "vuejs", label: prettySubject(vue.subject), subjectItem: vue },
      next && { id: "nextjs", label: prettySubject(next.subject), subjectItem: next },
      sql && { id: "sqlserver", label: prettySubject(sql.subject), subjectItem: sql },
    ].filter(Boolean);
  }, [vue, next, sql]);

  const activeItem =
    tabs.find((t) => t.id === active)?.subjectItem || tabs[0]?.subjectItem || null;

  const selectedFont = useMemo(() => {
    return FONT_OPTIONS.find((f) => f.id === fontId) || FONT_OPTIONS[0];
  }, [fontId]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <div
      className={[
        "h-screen w-full flex flex-col overscroll-none",
        // ✅ FULL background shorthand (includes base color) — fixes “mixed” theme
        "[background:radial-gradient(1200px_900px_at_18%_0%,rgba(99,102,241,0.14),transparent_55%),radial-gradient(900px_700px_at_92%_12%,rgba(56,189,248,0.14),transparent_58%),radial-gradient(900px_700px_at_60%_92%,rgba(16,185,129,0.10),transparent_55%),#f3f4f6]",
        "dark:[background:radial-gradient(1200px_900px_at_18%_0%,rgba(99,102,241,0.22),transparent_55%),radial-gradient(900px_700px_at_92%_12%,rgba(56,189,248,0.20),transparent_58%),radial-gradient(900px_700px_at_60%_92%,rgba(16,185,129,0.16),transparent_55%),#0b1220]",
      ].join(" ")}
      style={{ "--card-font": selectedFont.css }}
    >
      {/* TOPBAR */}
      <div
        className={[
          "sticky top-0 z-50 px-3 py-[10px]",
          "bg-white/88 border-b border-slate-900/10",
          "shadow-[0_10px_28px_rgba(17,24,39,0.06)]",
          "backdrop-blur-[14px] backdrop-saturate-[180%]",
          "dark:bg-slate-900/78 dark:border-white/10 dark:shadow-[0_10px_28px_rgba(0,0,0,0.35)]",
        ].join(" ")}
      >
        {/* brand row */}
        <div
          className={[
            "flex items-center justify-between gap-[10px]",
            "mb-2 text-[14px] leading-none tracking-[0.15px] font-[700]",
            "text-slate-900 dark:text-slate-200/80",
          ].join(" ")}
        >
          <div className="flex items-center gap-2 min-w-0">
            <img
              className="w-[18px] h-[18px] rounded-[6px] object-cover flex-none dark:shadow-[0_0_0_1px_rgba(255,255,255,0.12)]"
              src="/favicon_new.png"
              alt="Tinitiate"
            />
            <span className="truncate">Tinitiate IT Training</span>
          </div>

          {/* actions */}
          <div className="flex items-center gap-[10px] relative" ref={actionsRef}>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              title={theme === "dark" ? "Light mode" : "Dark mode"}
              className={[
                "h-[34px] w-[34px] rounded-full grid place-items-center",
                "border border-slate-900/12 bg-white/95 text-slate-900",
                "shadow-[0_10px_22px_rgba(17,24,39,0.10)]",
                "transition-[transform,box-shadow,background] duration-150 ease-out",
                "hover:-translate-y-[1px] hover:shadow-[0_14px_28px_rgba(17,24,39,0.14)] active:translate-y-0 active:opacity-95",
                "dark:bg-slate-900/95 dark:border-white/14 dark:text-slate-200 dark:shadow-[0_10px_22px_rgba(0,0,0,0.45)]",
              ].join(" ")}
            >
              {theme === "dark" ? <FiSun size={16} /> : <FiMoon size={16} />}
            </button>

            <button
              type="button"
              onClick={() => setFontOpen((v) => !v)}
              aria-label="Choose font"
              title="Fonts"
              className={[
                "h-[34px] w-[34px] rounded-full grid place-items-center",
                "border border-slate-900/12 bg-white/95 text-slate-900",
                "shadow-[0_10px_22px_rgba(17,24,39,0.10)]",
                "transition-[transform,box-shadow,background] duration-150 ease-out",
                "hover:-translate-y-[1px] hover:shadow-[0_14px_28px_rgba(17,24,39,0.14)] active:translate-y-0 active:opacity-95",
                "dark:bg-slate-900/95 dark:border-white/14 dark:text-slate-200 dark:shadow-[0_10px_22px_rgba(0,0,0,0.45)]",
              ].join(" ")}
            >
              <FiType size={16} />
            </button>

            {/* font popover */}
            {fontOpen && (
              <div
                role="menu"
                aria-label="Font menu"
                className={[
                  "absolute right-0 top-[42px] w-[220px] z-[80]",
                  "p-[10px] rounded-[14px]",
                  "border border-slate-900/10 bg-white/96",
                  "shadow-[0_24px_60px_rgba(17,24,39,0.18)]",
                  "backdrop-blur-[12px] backdrop-saturate-[180%]",
                  "dark:bg-slate-900/92 dark:border-white/12 dark:shadow-[0_24px_60px_rgba(0,0,0,0.55)]",
                ].join(" ")}
              >
                <div className="px-2 pt-[6px] pb-2 text-[12px] font-[800] text-slate-900/75 dark:text-slate-200/78">
                  Font
                </div>

                {FONT_OPTIONS.map((f) => {
                  const selected = f.id === fontId;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setFontId(f.id);
                        setFontOpen(false);
                      }}
                      style={{ fontFamily: f.css }}
                      className={[
                        "w-full flex items-center justify-between gap-[10px]",
                        "px-[10px] py-[9px] rounded-[12px]",
                        "border transition-[background,transform,border-color] duration-150 ease-out",
                        selected
                          ? "bg-slate-900/[0.06] border-slate-900/10 dark:bg-white/[0.07] dark:border-white/12"
                          : "bg-transparent border-transparent",
                        "hover:bg-slate-900/[0.05] hover:-translate-y-[1px]",
                        "dark:hover:bg-white/[0.06]",
                      ].join(" ")}
                    >
                      <span className="text-[13px] font-[650] text-slate-900/90 dark:text-slate-200/92">
                        {f.name}
                      </span>
                      {selected ? (
                        <span className="text-[13px] font-[900] text-slate-900/75 dark:text-slate-200/75">
                          ✓
                        </span>
                      ) : (
                        <span className="w-3 h-3" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* tabs */}
        <div
          role="tablist"
          aria-label="Subjects"
          className={[
            "flex gap-2 overflow-x-auto scrollbar-hide p-1 rounded-full",
            "bg-slate-900/[0.04] border border-slate-900/[0.06]",
            "dark:bg-white/[0.06] dark:border-white/[0.08]",
          ].join(" ")}
        >
          {tabs.map((t) => {
            const activeTab = t.id === active;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={activeTab}
                onClick={() => setActive(t.id)}
                className={[
                  "whitespace-nowrap rounded-full px-3 py-2 text-[13px] leading-[1.1] font-[560]",
                  "transition-[transform,background,border-color,color,box-shadow] duration-150 ease-out",
                  activeTab
                    ? "bg-white/92 border border-slate-900/10 text-slate-900 shadow-[0_10px_18px_rgba(17,24,39,0.08)] dark:bg-slate-900/92 dark:border-white/12 dark:text-slate-200 dark:shadow-[0_10px_18px_rgba(0,0,0,0.35)]"
                    : "bg-transparent border border-transparent text-slate-900/78 dark:text-slate-200/80",
                  "hover:bg-white/55 hover:-translate-y-[1px]",
                ].join(" ")}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="mt-2 text-[12px] font-[600] opacity-55 text-slate-900 dark:text-slate-200/80">
          Choose a subject • Swipe left/right to switch topics
        </div>
      </div>

      {/* main */}
      <div className="flex-1 min-h-0">
        {activeItem ? (
          <SubjectPager subjectItem={activeItem} />
        ) : (
          <div className="p-4 font-[900]">No subjects found.</div>
        )}
      </div>
    </div>
  );
}
