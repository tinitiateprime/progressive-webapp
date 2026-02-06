"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FiType } from "react-icons/fi";
import SubjectPager from "./SubjectPager2";
import "./mobileCatalog2.css";

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

const FONT_OPTIONS = [
  { id: "inter", name: "Inter", css: `"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif` },
  { id: "roboto", name: "Roboto", css: `"Roboto", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Arial, sans-serif` },
  { id: "poppins", name: "Poppins", css: `"Poppins", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif` },
  { id: "nunito", name: "Nunito", css: `"Nunito", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif` },
  { id: "sourcesans", name: "Source Sans 3", css: `"Source Sans 3", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif` },
];

export default function MobileCatalog({ catalog }) {
  const [active, setActive] = useState("vuejs");

  const [fontId, setFontId] = useState(() => localStorage.getItem("mcat_font") || "inter");
  const [fontOpen, setFontOpen] = useState(false);

  const actionsRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("mcat_font", fontId);
  }, [fontId]);

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

  return (
    <div
      className="tntMc2ShellRoot"
      data-layout="hscroll"
      style={{ "--card-font": selectedFont.css }}
    >
      <div className="tntMc2TopbarSticky">
        <div className="tntMc2BrandRowFlex">
          <div className="tntMc2BrandLeftFlex">
            <img className="tntMc2BrandIconImg" src="/favicon_new.png" alt="Tinitiate" />
            <span className="tntMc2BrandTextStrong">Tinitiate IT Training</span>
          </div>

          <div className="tntMc2ActionsWrap" ref={actionsRef}>
            <button
              type="button"
              className="tntMc2FontBtn"
              onClick={() => setFontOpen((v) => !v)}
              aria-label="Choose font"
              title="Fonts"
            >
              <FiType size={16} />
              <span className="tntMc2FontBtnText">Font</span>
            </button>

            {fontOpen && (
              <div className="tntMc2FontMenuPop" role="menu" aria-label="Font menu">
                <div className="tntMc2FontMenuTitleBar">Font</div>

                {FONT_OPTIONS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`tntMc2FontItemBtn ${f.id === fontId ? "tntMc2FontItemBtnSelected" : ""}`}
                    onClick={() => {
                      setFontId(f.id);
                      setFontOpen(false);
                    }}
                    style={{ fontFamily: f.css }}
                  >
                    <span className="tntMc2FontNameTxt">{f.name}</span>
                    {f.id === fontId ? (
                      <span className="tntMc2FontCheckMark">✓</span>
                    ) : (
                      <span className="tntMc2FontCheckGhostMark" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="tntMc2TabsRail" role="tablist" aria-label="Subjects">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`tntMc2TabBtn ${t.id === active ? "tntMc2TabBtnActive" : ""}`}
              onClick={() => setActive(t.id)}
              role="tab"
              aria-selected={t.id === active}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="tntMc2HintTxt">Choose a subject • Swipe left/right to switch topics</div>
      </div>

      <div className="tntMc2MainArea">
        {activeItem ? <SubjectPager subjectItem={activeItem} /> : <div style={{ padding: 16, fontWeight: 900 }}>No subjects found.</div>}
      </div>
    </div>
  );
}
