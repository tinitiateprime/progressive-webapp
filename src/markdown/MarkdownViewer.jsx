import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function CodeBlock({ codeText }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="relative">
    
    </div>
  );
}

export default function MarkdownViewer({ content }) {
  const md = useMemo(() => String(content || ""), [content]);

  return (
    <div
      className={[
        "max-w-full m-0 p-0",
        "leading-[1.65]",
        "text-[clamp(14px,3.4vw,16px)]",
        "text-slate-900 dark:text-slate-200",
      ].join(" ")}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (props) => (
            <h1 className="mt-[18px] mb-[10px] leading-[1.25] font-[800]" {...props} />
          ),
          h2: (props) => (
            <h2 className="mt-[18px] mb-[10px] leading-[1.25] font-[800]" {...props} />
          ),
          h3: (props) => (
            <h3 className="mt-[18px] mb-[10px] leading-[1.25] font-[800]" {...props} />
          ),
          p: (props) => <p className="my-[10px]" {...props} />,
          ul: (props) => <ul className="pl-[18px] my-[10px] list-disc" {...props} />,
          li: (props) => <li className="my-[6px]" {...props} />,
          img: (props) => (
            <img
              {...props}
              className={[
                "max-w-full h-auto w-auto block mx-auto my-[10px]",
                "object-contain rounded-[14px]",
                "shadow-[0_14px_30px_rgba(17,24,39,0.10)]",
              ].join(" ")}
              alt={props.alt || ""}
            />
          ),
          code: ({ inline, className, children, ...props }) => {
            const text = String(children || "");
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

            // fenced code block
            return (
              <div className="relative">
                <CodeBlock codeText={text} />
                <pre
                  className={[
                    "mt-2 rounded-[12px] p-3 overflow-x-auto overflow-y-hidden scrollbar-hide",
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
  );
}
