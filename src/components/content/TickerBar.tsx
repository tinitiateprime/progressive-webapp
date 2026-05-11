import type { CSSProperties } from "react";
import type { TickerItem } from "../../lib/content-types";

const toneStyles: Record<TickerItem["kind"], CSSProperties> = {
  jobs: {
    borderColor: "rgba(34,197,94,0.35)",
    color: "#166534",
  },
  "trending-technologies": {
    borderColor: "rgba(37,99,235,0.35)",
    color: "#1d4ed8",
  },
  events: {
    borderColor: "rgba(249,115,22,0.35)",
    color: "#c2410c",
  },
};

type TickerBarProps = {
  items: TickerItem[];
};

export default function TickerBar({ items }: TickerBarProps) {
  if (!items.length) return null;

  const loopItems = [...items, ...items];

  return (
    <div className="ticker-shell">
      <div className="ticker-track">
        {loopItems.map((item, index) => (
          <a
            key={`${item.id}-${index}`}
            href={item.href}
            target="_blank"
            rel="noreferrer"
            className="ticker-pill"
          >
            <span className="ticker-label" style={toneStyles[item.kind]}>
              {item.label}
            </span>
            <span>{item.title}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
