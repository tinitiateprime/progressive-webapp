import { useEffect, useRef } from "react";
import TopicCard from "./TopicCard";

export default function TopicRow({ rowNumber, topics, showRowLabel }) {
  const scrollerRef = useRef(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const onWheel = (e) => {
      // Only act if this row can scroll horizontally
      if (el.scrollWidth <= el.clientWidth) return;

      // Trackpads can generate deltaX already; don't fight it.
      // For mouse wheel (mostly deltaY), convert to horizontal scroll.
      const isMostlyVertical = Math.abs(e.deltaY) > Math.abs(e.deltaX);

      if (isMostlyVertical) {
        e.preventDefault(); // stop page scroll ONLY while hovering this row
        el.scrollLeft += e.deltaY;
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div className="cnRowBlock">
      {showRowLabel ? <div className="cnRowLabel">Row {rowNumber}</div> : null}

      <div className="cnRowScroll" ref={scrollerRef}>
        <div className="cnRowInner">
          {(topics || []).map((t, idx) => (
            <TopicCard key={`${t?.topic_name || "topic"}-${idx}`} topic={t} />
          ))}
        </div>
      </div>
    </div>
  );
}
