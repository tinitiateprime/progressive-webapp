"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import TopicCardSlide from "./TopicCardSlide";

function isReadme(topic) {
  return String(topic?.topic_name || "").toLowerCase().trim() === "readme";
}

function toNum(v, fallback = 9999) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function sortTopics(topics = []) {
  const arr = [...topics];
  arr.sort((a, b) => {
    const ar = isReadme(a);
    const br = isReadme(b);
    if (ar !== br) return ar ? -1 : 1;

    const ap = toNum(a?.topic_position);
    const bp = toNum(b?.topic_position);
    if (ap !== bp) return ap - bp;

    const asr = toNum(a?.scroll_row);
    const bsr = toNum(b?.scroll_row);
    if (asr !== bsr) return asr - bsr;

    return String(a?.topic_name || "").localeCompare(String(b?.topic_name || ""));
  });
  return arr;
}

/* ✅ allow code blocks to still scroll horizontally */
function findScrollableX(startEl, stopEl) {
  let el = startEl;
  while (el && el !== stopEl && el !== document.body) {
    const style = window.getComputedStyle(el);
    const ox = style.overflowX;
    const canOverflow = ox === "auto" || ox === "scroll";
    if (canOverflow && el.scrollWidth > el.clientWidth + 4) return el;
    el = el.parentElement;
  }
  return null;
}
function canScrollX(el, dx) {
  if (!el) return false;
  const max = el.scrollWidth - el.clientWidth;
  if (max <= 1) return false;
  if (dx > 0) return el.scrollLeft < max - 1;
  return el.scrollLeft > 1;
}

/* ✅ allow card body to scroll vertically; only page when it can't */
function findScrollableY(startEl, stopEl) {
  let el = startEl;
  while (el && el !== stopEl && el !== document.body) {
    const style = window.getComputedStyle(el);
    const oy = style.overflowY;
    const canOverflow = oy === "auto" || oy === "scroll";
    if (canOverflow && el.scrollHeight > el.clientHeight + 4) return el;
    el = el.parentElement;
  }
  return null;
}
function canScrollY(el, dy) {
  if (!el) return false;
  const max = el.scrollHeight - el.clientHeight;
  if (max <= 1) return false;
  if (dy > 0) return el.scrollTop < max - 1;
  return el.scrollTop > 1;
}

const DURATION_MS = 650;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const WHEEL_THRESHOLD = 90;
const COOLDOWN_MS = 450;

export default function SubjectPager({ subjectItem }) {
  const { subject, topics = [] } = subjectItem || {};
  const ordered = useMemo(() => sortTopics(topics), [topics]);

  const pagerRef = useRef(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [anim, setAnim] = useState(null);

  const lockRef = useRef(false);
  const accRef = useRef({ x: 0, y: 0 });
  const timeoutRef = useRef(null);

  const activeRef = useRef(0);
  const animatingRef = useRef(false);

  const touchTargetRef = useRef(null);

  useEffect(() => {
    activeRef.current = activeIndex;
  }, [activeIndex]);

  const clampIndex = (i) => Math.max(0, Math.min(i, ordered.length - 1));

  const lockPaging = () => {
    lockRef.current = true;
    setTimeout(() => (lockRef.current = false), COOLDOWN_MS);
  };

  const startNav = (dir, axis) => {
    if (lockRef.current || animatingRef.current) return;

    const from = activeRef.current;
    const to = clampIndex(from + dir);
    if (to === from) return;

    animatingRef.current = true;
    setAnim({ from, to, axis, dir, phase: "prep" });

    setActiveIndex(to);

    requestAnimationFrame(() => {
      setAnim((s) => (s ? { ...s, phase: "run" } : s));
    });

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setAnim(null);
      animatingRef.current = false;
    }, DURATION_MS);

    lockPaging();
  };

  // ✅ NEW: jump directly to any topic index (used by README dropdown)
  const jumpToIndex = (toIndex) => {
    if (lockRef.current || animatingRef.current) return;

    const from = activeRef.current;
    const to = clampIndex(toIndex);
    if (to === from) return;

    const dir = to > from ? 1 : -1;

    animatingRef.current = true;
    setAnim({ from, to, axis: "x", dir, phase: "prep" });
    setActiveIndex(to);

    requestAnimationFrame(() => {
      setAnim((s) => (s ? { ...s, phase: "run" } : s));
    });

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setAnim(null);
      animatingRef.current = false;
    }, DURATION_MS);

    lockPaging();
  };

  // reset when subject changes
  useEffect(() => {
    setActiveIndex(0);
    setAnim(null);
    animatingRef.current = false;
    accRef.current = { x: 0, y: 0 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject]);

  // wheel handling (capture)
  useEffect(() => {
    const el = pagerRef.current;
    if (!el) return;

    const onWheel = (e) => {
      if (lockRef.current || animatingRef.current) return;

      let dx = e.deltaX || 0;
      let dy = e.deltaY || 0;

      if (e.shiftKey && Math.abs(dx) < 2 && Math.abs(dy) > 2) {
        dx = dy;
        dy = 0;
      }

      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      const mostlyHorizontal = absX > absY && absX > 3;
      const mostlyVertical = absY >= absX && absY > 3;

      if (mostlyHorizontal) {
        const scrollerX = findScrollableX(e.target, el);
        if (scrollerX && canScrollX(scrollerX, dx)) return;

        e.preventDefault();
        accRef.current.x += dx;

        if (Math.abs(accRef.current.x) < WHEEL_THRESHOLD) return;

        const dir = accRef.current.x > 0 ? 1 : -1;
        accRef.current.x = 0;

        startNav(dir, "x");
        return;
      }

      if (mostlyVertical) {
        const scrollerY = findScrollableY(e.target, el);
        if (scrollerY && canScrollY(scrollerY, dy)) return;

        e.preventDefault();
        accRef.current.y += dy;

        if (Math.abs(accRef.current.y) < WHEEL_THRESHOLD) return;

        const dir = accRef.current.y > 0 ? 1 : -1;
        accRef.current.y = 0;

        startNav(dir, "y");
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false, capture: true });
    return () => el.removeEventListener("wheel", onWheel, { capture: true });
  }, [ordered.length]);

  // touch swipe
  useEffect(() => {
    const el = pagerRef.current;
    if (!el) return;

    let sx = 0;
    let sy = 0;

    const onTouchStart = (e) => {
      const t = e.touches?.[0];
      if (!t) return;
      sx = t.clientX;
      sy = t.clientY;
      touchTargetRef.current = e.target;
    };

    const onTouchEnd = (e) => {
      if (lockRef.current || animatingRef.current) return;

      const t = e.changedTouches?.[0];
      if (!t) return;

      const dx = t.clientX - sx;
      const dy = t.clientY - sy;

      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (absX > 60 && absX > absY * 1.2) {
        startNav(dx < 0 ? 1 : -1, "x");
        return;
      }

      if (absY > 60 && absY > absX * 1.2) {
        const startTarget = touchTargetRef.current;
        const scrollIntent = -dy;

        const scrollerY = findScrollableY(startTarget, el);
        if (scrollerY && canScrollY(scrollerY, scrollIntent)) return;

        const dir = scrollIntent > 0 ? 1 : -1;
        startNav(dir, "y");
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [ordered.length]);

  const slideStyleFor = (idx) => {
    const baseTransition =
      anim?.phase === "run" ? `transform ${DURATION_MS}ms ${EASE}` : "none";

    if (!anim) {
      return {
        transform: idx === activeIndex ? "translate3d(0,0,0)" : "translate3d(200%,0,0)",
        opacity: idx === activeIndex ? 1 : 0,
        transition: "none",
      };
    }

    const { from, to, axis, dir, phase } = anim;

    const off = (n) =>
      axis === "x" ? `translate3d(${n}%,0,0)` : `translate3d(0,${n}%,0)`;

    if (idx === from) {
      return {
        transform: phase === "run" ? off(-dir * 100) : off(0),
        opacity: 1,
        transition: baseTransition,
      };
    }
    if (idx === to) {
      return {
        transform: phase === "run" ? off(0) : off(dir * 100),
        opacity: 1,
        transition: baseTransition,
      };
    }

    return { transform: off(200), opacity: 0, transition: "none" };
  };

  return (
    <div className="mVPager" ref={pagerRef} aria-label={`Pager for ${subject}`}>
      {ordered.map((t, idx) => (
        <TopicCardSlide
          key={`${subject}-${t?.topic_name || "topic"}-${idx}`}
          topic={t}
          subject={subject}
          index={idx}
          total={ordered.length}
          activeIndex={activeIndex}
          isOpen={true}
          onOpen={() => {}}
          onClose={() => {}}
          slideStyle={slideStyleFor(idx)}
          orderedTopics={ordered}
          onJumpToIndex={jumpToIndex}
        />
      ))}
    </div>
  );
}
