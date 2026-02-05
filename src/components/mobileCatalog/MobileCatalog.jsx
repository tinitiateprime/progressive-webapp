"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FiMoon, FiSun, FiType } from "react-icons/fi";
import SubjectPager from "./SubjectPager";
import "./mobileCatalog.css";

function norm(s) {
  return String(s || "").toLowerCase().trim();
}

const SUBJECT_LABELS = {
  vuejs: "Vue.js",
  nextjs: "Next.js",
  sqlserver: "SQL Server",
};

function prettySubject(subject) {
  const key = norm(subject);
  return SUBJECT_LABELS[key] || subject || "Subject";
}

function pickSubject(catalog, id) {
  const key = norm(id);
  return (catalog || []).find((x) => norm(x.subject) === key) || null;
}

/** ✅ 5 Google font options (must match your CSS @import) */
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

  // ✅ theme + font
  const [theme, setTheme] = useState(() => localStorage.getItem("mcat_theme") || "light");
  const [fontId, setFontId] = useState(() => localStorage.getItem("mcat_font") || "inter");
  const [fontOpen, setFontOpen] = useState(false);

  const actionsRef = useRef(null);

  // persist theme/font
  useEffect(() => {
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
      className="mCatWrap"
      data-theme={theme}
      style={{
        "--card-font": selectedFont.css,
      }}
    >
      <div className="mCatTopbar">
        <div className="mCatBrand">
          <div className="mBrandLeft">
            <img className="mBrandIcon" src="/favicon_new.png" alt="Tinitiate" />
            <span className="mCatBrandText">Tinitiate IT Training</span>
          </div>

          <div className="mTopActions" ref={actionsRef}>
            <button
              type="button"
              className="mIconBtn"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              title={theme === "dark" ? "Light mode" : "Dark mode"}
            >
              {theme === "dark" ? <FiSun size={16} /> : <FiMoon size={16} />}
            </button>

            <button
              type="button"
              className="mIconBtn"
              onClick={() => setFontOpen((v) => !v)}
              aria-label="Choose font"
              title="Fonts"
            >
              <FiType size={16} />
            </button>

            {fontOpen && (
              <div className="mFontMenu" role="menu" aria-label="Font menu">
                <div className="mFontMenuTitle">Font</div>

                {FONT_OPTIONS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`mFontItem ${f.id === fontId ? "isSelected" : ""}`}
                    onClick={() => {
                      setFontId(f.id);
                      setFontOpen(false);
                    }}
                    style={{ fontFamily: f.css }}
                  >
                    <span className="mFontName">{f.name}</span>
                    {f.id === fontId ? <span className="mCheck">✓</span> : <span className="mCheckGhost" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mCatTabs" role="tablist" aria-label="Subjects">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`mCatTab ${t.id === active ? "isActive" : ""}`}
              onClick={() => setActive(t.id)}
              role="tab"
              aria-selected={t.id === active}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mCatHint">Choose a subject • Swipe left/right to switch topics</div>
      </div>

      <div className="mCatMain">
        {activeItem ? (
          <SubjectPager subjectItem={activeItem} />
        ) : (
          <div style={{ padding: 16, fontWeight: 900 }}>No subjects found.</div>
        )}
      </div>
    </div>
  );
}
