"use client";

import { useEffect, useMemo, useRef } from "react";
import { useMarkdown } from "../../hooks/useMarkdown";
import MarkdownViewer from "../../markdown/MarkdownViewer";

function norm(s) {
  return String(s || "").toLowerCase().trim();
}

export default function TopicCardSlide({
  topic,
  subject,

  // kept for compatibility
  isOpen,
  onOpen,
  onClose,

  index,
  total,
  activeIndex,

  slideStyle,
  slideClassName,

  orderedTopics = [],
  onJumpToIndex,
}) {
  const title = useMemo(() => topic?.topic_name || "Topic", [topic]);
  const isActive = activeIndex === index;

  const mdUrl = isActive ? topic?.md_url || "" : "";
  const { content, loading, error } = useMarkdown(mdUrl);

  const cardRef = useRef(null);
  const bodyRef = useRef(null);

  const subjectKey = norm(subject);

  // ✅ hide "Back to Content" for SQL Server (your existing behavior)
  useEffect(() => {
    if (!isActive) return;
    if (subjectKey !== "sqlserver") return;
    if (!cardRef.current) return;

    const id = requestAnimationFrame(() => {
      const root = cardRef.current;
      const nodes = root.querySelectorAll("a,button");
      nodes.forEach((n) => {
        const txt = String(n.textContent || "").trim().toLowerCase();
        if (txt === "back to content") {
          n.style.display = "none";
          n.setAttribute("aria-hidden", "true");
        }
      });
    });

    return () => cancelAnimationFrame(id);
  }, [isActive, subjectKey, content, loading, error]);

  // ✅ KEY: column width should match visible card body width
  useEffect(() => {
    if (!isActive) return;
    const el = bodyRef.current;
    if (!el) return;

    const apply = () => {
      const w = el.clientWidth || 320;
      el.style.setProperty("--mcolw", `${w}px`);
    };

    apply();

    const ro = new ResizeObserver(() => apply());
    ro.observe(el);

    return () => ro.disconnect();
  }, [isActive]);

  // ✅ when opening a new topic, always start at the beginning (left)
  useEffect(() => {
    if (!isActive) return;
    const el = bodyRef.current;
    if (!el) return;
    el.scrollLeft = 0;
  }, [isActive, mdUrl]);

  const showTopicDropdown =
    isActive && Array.isArray(orderedTopics) && orderedTopics.length > 0;

  return (
    <section
      className={`mVSlide ${slideClassName || ""}`}
      style={slideStyle}
      aria-hidden={!isActive}
    >
      <div className="mCard" ref={cardRef} data-subjectkey={subjectKey}>
        <div className="mCardHeader">
          <div className="mCardTitle">{title}</div>

          <div className="mCardMeta">
            <div className="mMetaRow">
              {subject ? <span className="mMetaPill">{subject}</span> : null}

              {showTopicDropdown ? (
                <div className="mTopicPicker" aria-label="Topic dropdown">
                  <select
                    className="mTopicSelect"
                    value={index}
                    onChange={(e) => {
                      const idx = Number(e.target.value);
                      if (!Number.isFinite(idx)) return;
                      if (typeof onJumpToIndex === "function") onJumpToIndex(idx);
                    }}
                  >
                    {orderedTopics.map((t, idx) => (
                      <option
                        key={`${subjectKey}-${t?.topic_name || "topic"}-${idx}`}
                        value={idx}
                      >
                        {t?.topic_name || `Topic ${idx + 1}`}
                      </option>
                    ))}
                  </select>

                  <span className="mTopicCount" aria-hidden="true">
                    {orderedTopics.length}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {Number.isFinite(total) && total > 0 ? (
            <div className="mCardIndex" aria-label={`Card ${index + 1} of ${total}`}>
              {index + 1}/{total}
            </div>
          ) : null}
        </div>

        <div
          ref={bodyRef}
          className="mCardBody"
          /* Tailwind-friendly (works if Tailwind is on):
             className="mCardBody overflow-x-auto overflow-y-hidden"
           */
        >
          {!isActive ? (
            <div className="mCardPreview" aria-hidden="true" />
          ) : loading ? (
            <div className="mCardLoading">Loading markdown…</div>
          ) : error ? (
            <div className="mCardError">
              <div style={{ fontWeight: 900 }}>Failed to load</div>
              <div style={{ opacity: 0.8 }}>{String(error)}</div>
            </div>
          ) : (
            <MarkdownViewer content={content} />
          )}
        </div>
      </div>
    </section>
  );
}
