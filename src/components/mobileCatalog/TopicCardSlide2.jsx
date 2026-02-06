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

  // ✅ when opening a new topic, always start at TOP
  useEffect(() => {
    if (!isActive) return;
    const el = bodyRef.current;
    if (!el) return;
    el.scrollTop = 0;
  }, [isActive, mdUrl]);

  const showTopicDropdown =
    isActive && Array.isArray(orderedTopics) && orderedTopics.length > 0;

  return (
    <section
      className={`tntMc2PagerSlide ${slideClassName || ""}`}
      style={slideStyle}
      aria-hidden={!isActive}
    >
      <div className="tntMc2TopicCard" ref={cardRef} data-subjectkey={subjectKey}>
        <div className="tntMc2CardHeaderArea">
          <div className="tntMc2CardTitleTxt">{title}</div>

          <div className="tntMc2CardMetaArea">
            <div className="tntMc2MetaRowFlex">
              {subject ? <span className="tntMc2MetaPillTag">{subject}</span> : null}

              {showTopicDropdown ? (
                <div className="tntMc2TopicPickerWrap" aria-label="Topic dropdown">
                  <select
                    className="tntMc2TopicSelectCtrl"
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
                </div>
              ) : null}
            </div>
          </div>

          {Number.isFinite(total) && total > 0 ? (
            <div className="tntMc2CardIndexTxt" aria-label={`Card ${index + 1} of ${total}`}>
              {index + 1}/{total}
            </div>
          ) : null}
        </div>

        {/* ✅ NEW CLASS: vertical scroll container */}
        <div ref={bodyRef} className="tntMc2CardBodyScrollY">
          {!isActive ? (
            <div className="tntMc2CardPreviewBlank" aria-hidden="true" />
          ) : loading ? (
            <div className="tntMc2CardLoadingTxt">Loading markdown…</div>
          ) : error ? (
            <div className="tntMc2CardErrorBox">
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
