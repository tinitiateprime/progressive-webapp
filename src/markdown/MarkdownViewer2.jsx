import { useCallback, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function CodeBlock({ codeText }) {
  const [copied, setCopied] = useState(false);

  return <div className="relative">{/* copy button later */}</div>;
}

export default function MarkdownViewer({ content, baseUrl = "" }) {
  const md = useMemo(() => String(content || ""), [content]);

  // ✅ resolve relative URLs (images/links) against MD file URL
  const resolveUrl = useCallback(
    (url) => {
      if (!url) return "";
      const u = String(url).trim();

      // already absolute or special schemes
      if (/^(https?:|data:|blob:|mailto:|tel:)/i.test(u)) return u;
      if (u.startsWith("//")) return `https:${u}`;

      // GitHub "blob" -> "raw"
      if (u.startsWith("https://github.com/") && u.includes("/blob/")) {
        return u
          .replace("https://github.com/", "https://raw.githubusercontent.com/")
          .replace("/blob/", "/");
      }

      // resolve relative paths using baseUrl (md_url)
      try {
        return baseUrl ? new URL(u, baseUrl).toString() : u;
      } catch {
        return u;
      }
    },
    [baseUrl]
  );

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
        urlTransform={resolveUrl} // ✅ fixes markdown img/link urls
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

          // ✅ Wrap image + resolve src
          img: ({ src, alt, ...rest }) => {
            const fixedSrc = resolveUrl(src);
            return (
              <figure className="my-[10px] w-full">
                <img
                  {...rest}
                  src={fixedSrc}
                  alt={alt || ""}
                  loading="lazy"
                  className={[
                    "w-full h-auto block mx-auto",
                    "object-contain rounded-[14px]",
                    "shadow-[0_14px_30px_rgba(17,24,39,0.10)]",
                  ].join(" ")}
                  onError={() => console.warn("Image failed:", fixedSrc)}
                />
              </figure>
            );
          },

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
