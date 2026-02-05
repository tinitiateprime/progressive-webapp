import "./markdown.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function CodeBlock({ inline, className, children }) {
  const code = String(children ?? "");
  const isBlock = !inline;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      alert("Copied!");
    } catch {
      alert("Copy failed");
    }
  };

  if (!isBlock) {
    return <code className={className}>{children}</code>;
  }

  return (
    <div className="mdCodeWrap">
      <button className="mdCopyBtn" onClick={onCopy} type="button">
        Copy
      </button>
      <pre className={className}>
        <code>{children}</code>
      </pre>
    </div>
  );
}

export default function MarkdownViewer({ content }) {
  return (
    <div className="mdWrap">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code: CodeBlock,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
