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

  // ✅ from SubjectPager
  orderedTopics = [],
  onJumpToIndex,
}) {
  const title = useMemo(() => topic?.topic_name || "Topic", [topic]);

  const isActive = activeIndex === index;
  const mdUrl = isActive ? topic?.md_url || "" : "";

  const { content, loading, error } = useMarkdown(mdUrl);

  // ✅ NEW: card ref to allow hiding "Back to Content" in SQL Server only
  const cardRef = useRef(null);
  const subjectKey = norm(subject);

  // ✅ Hide "Back to Content" button/link for SQL Server cards
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

  // ✅ UPDATED: dropdown on EVERY card (for the active visible card)
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
            {/* ✅ Keep subject pill (vuejs/nextjs/sqlserver) and place dropdown next to it */}
            <div className="mMetaRow">
              {subject ? <span className="mMetaPill">{subject}</span> : null}

              {/* ✅ Topic dropdown available on every card */}
              {showTopicDropdown ? (
                <div className="mTopicPicker" aria-label="Topic dropdown">
                  <select
                    className="mTopicSelect"
                    value={index} // current topic index
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

        <div className="mCardBody">
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
