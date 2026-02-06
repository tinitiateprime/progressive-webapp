"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import TopicCardSlide from "./TopicCardSlide2";

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

const DURATION_MS = 650;
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

  useEffect(() => {
    activeRef.current = activeIndex;
  }, [activeIndex]);

  const clampIndex = (i) => Math.max(0, Math.min(i, ordered.length - 1));

  const lockPaging = () => {
    lockRef.current = true;
    setTimeout(() => (lockRef.current = false), COOLDOWN_MS);
  };

  const startNav = (dir) => {
    if (lockRef.current || animatingRef.current) return;

    const from = activeRef.current;
    const to = clampIndex(from + dir);
    if (to === from) return;

    animatingRef.current = true;
    setAnim({ from, to, dir, phase: "prep" });
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

  const jumpToIndex = (toIndex) => {
    if (lockRef.current || animatingRef.current) return;

    const from = activeRef.current;
    const to = clampIndex(toIndex);
    if (to === from) return;

    const dir = to > from ? 1 : -1;

    animatingRef.current = true;
    setAnim({ from, to, dir, phase: "prep" });
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

  useEffect(() => {
    setActiveIndex(0);
    setAnim(null);
    animatingRef.current = false;
    accRef.current = { x: 0, y: 0 };
  }, [subject]);

  // ✅ Allow vertical scroll; only intercept big horizontal trackpad swipes
  useEffect(() => {
    const el = pagerRef.current;
    if (!el) return;

    const onWheel = (e) => {
      if (lockRef.current || animatingRef.current) return;

      const dx = e.deltaX || 0;
      const dy = e.deltaY || 0;

      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      // ✅ Vertical scroll should work normally
      if (absY >= absX) return;

      // ✅ Horizontal swipe → change topic
      if (absX > 3) {
        e.preventDefault();
        accRef.current.x += dx;
        if (Math.abs(accRef.current.x) >= WHEEL_THRESHOLD) {
          startNav(accRef.current.x > 0 ? 1 : -1);
          accRef.current.x = 0;
        }
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false, capture: true });
    return () => el.removeEventListener("wheel", onWheel, { capture: true });
  }, [ordered.length]);

  const slideStyleFor = (idx) => {
    if (!anim) {
      return {
        transform: idx === activeIndex ? "translate3d(0,0,0)" : "translate3d(200%,0,0)",
        opacity: idx === activeIndex ? 1 : 0,
      };
    }

    const { from, to, dir, phase } = anim;
    const off = (n) => `translate3d(${n}%,0,0)`;

    if (idx === from) return { transform: phase === "run" ? off(-dir * 100) : off(0) };
    if (idx === to) return { transform: phase === "run" ? off(0) : off(dir * 100) };
    return { transform: off(200), opacity: 0 };
  };

  return (
    <div className="tntMc2PagerRoot" ref={pagerRef}>
      {ordered.map((t, idx) => (
        <TopicCardSlide
          key={`${subject}-${idx}`}
          topic={t}
          subject={subject}
          index={idx}
          total={ordered.length}
          activeIndex={activeIndex}
          isOpen
          slideStyle={slideStyleFor(idx)}
          orderedTopics={ordered}
          onJumpToIndex={jumpToIndex}
        />
      ))}
    </div>
  );
}
