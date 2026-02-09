"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function CodeBlock({ codeText }) {
  // keep your copy button logic here later
  return <div className="relative" />;
}

export default function MarkdownViewer({ content, paged = false }) {
  const md = useMemo(() => String(content || ""), [content]);

  const wrapRef = useRef(null);
  const [pageW, setPageW] = useState(0);

  // each “page” = exactly visible width
  useEffect(() => {
    if (!paged) return;
    const el = wrapRef.current;
    if (!el) return;

    const update = () => setPageW(el.clientWidth || 0);
    update();

    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [paged]);

  // ✅ shrink code blocks so they fit in ONE screen (no break)
  useEffect(() => {
    if (!paged) return;
    const root = wrapRef.current;
    if (!root) return;

    // this is the visible “page” height
    const host = root.parentElement; // the horizontal scroller
    const maxH = host?.clientHeight || 0;
    if (!maxH) return;

    const pres = root.querySelectorAll("pre");
    pres.forEach((pre) => {
      // reset then shrink if needed
      pre.style.fontSize = "";
      pre.style.lineHeight = "";

      let fs = 12; // start
      pre.style.fontSize = `${fs}px`;
      pre.style.lineHeight = "1.35";

      // small padding safety
      const SAFE = 18;

      // shrink until it fits or hits minimum
      while (pre.getBoundingClientRect().height > maxH - SAFE && fs > 9) {
        fs -= 1;
        pre.style.fontSize = `${fs}px`;
      }
    });
  }, [paged, md, pageW]);

  const columnStyle = paged
    ? {
        columnWidth: pageW ? `${pageW}px` : "100%",
        columnGap: "18px",
        columnFill: "auto",
      }
    : undefined;

  return (
    <div
      className={[
        "max-w-full m-0 p-0",
        "leading-[1.55]",
        "text-[clamp(14px,3.4vw,16px)]",
        "text-slate-900 dark:text-slate-200",
        paged ? "h-full" : "",
      ].join(" ")}
    >
      <div ref={wrapRef} style={columnStyle} className={paged ? "h-full" : ""}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // ✅ headings: try to keep with next content (prevents orphan headings + blank space under them)
            h1: (props) => (
              <h1
                className="mt-[12px] mb-[6px] leading-[1.25] font-[800] [break-after:avoid-column]"
                {...props}
              />
            ),
            h2: (props) => (
              <h2
                className="mt-[12px] mb-[6px] leading-[1.25] font-[800] [break-after:avoid-column]"
                {...props}
              />
            ),
            h3: (props) => (
              <h3
                className="mt-[12px] mb-[6px] leading-[1.25] font-[800] [break-after:avoid-column]"
                {...props}
              />
            ),

            // ✅ IMPORTANT: allow text to break so the column fills (removes big blanks)
            p: (props) => <p className="my-[8px]" {...props} />,
            ul: (props) => <ul className="pl-[18px] my-[8px] list-disc" {...props} />,
            ol: (props) => <ol className="pl-[18px] my-[8px] list-decimal" {...props} />,
            li: (props) => <li className="my-[4px]" {...props} />,

            hr: (props) => (
              <hr className="my-[10px] border-slate-900/15 dark:border-white/15" {...props} />
            ),

            // keep images together (optional)
            img: (props) => (
              <img
                {...props}
                className={[
                  "max-w-full h-auto w-auto block mx-auto my-[10px]",
                  "object-contain rounded-[14px]",
                  "shadow-[0_14px_30px_rgba(17,24,39,0.10)]",
                  "[break-inside:avoid-column]",
                ].join(" ")}
                alt={props.alt || ""}
              />
            ),

            // tables can scroll horizontally; keep as a block
            table: (props) => (
              <div className="my-[10px] overflow-x-auto overflow-y-hidden [break-inside:avoid-column]">
                <table className="w-full text-left border-collapse text-[14px]" {...props} />
              </div>
            ),

            code: ({ inline, className, children, ...props }) => {
              if (inline) {
                return (
                  <code
                    {...props}
                    className={[
                      "font-mono",
                      "px-[6px] py-[2px] rounded-[8px]",
                      "bg-slate-900/[0.06] dark:bg-white/[0.08]",
                    ].join(" ")}
                  >
                    {children}
                  </code>
                );
              }

              // ✅ fenced code block: NEVER break across pages
              return (
                <div className="relative [break-inside:avoid-column]">
                  <CodeBlock codeText={String(children || "")} />
                  <pre
                    className={[
                      "mt-[6px] rounded-[12px] p-2 overflow-x-auto overflow-y-hidden scrollbar-hide",
                      "bg-slate-900/[0.045] border border-slate-900/[0.08]",
                      "dark:bg-white/[0.06] dark:border-white/[0.10]",
                    ].join(" ")}
                  >
                    <code className={`font-mono ${className || ""}`}>{children}</code>
                  </pre>
                </div>
              );
            },
          }}
        > 
          {md}
        </ReactMarkdown>
      </div>
    </div>
  );
}
