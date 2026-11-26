import { Children, cloneElement, createElement, isValidElement, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const CITATION_RE = /\[(\d+)\]/g;

function renderTextWithCitations(text, citationMap, onCitationClick) {
  if (!citationMap || citationMap.size === 0 || typeof text !== "string") {
    return text;
  }

  const parts = [];
  let lastIndex = 0;
  let match;
  CITATION_RE.lastIndex = 0;

  while ((match = CITATION_RE.exec(text)) !== null) {
    const num = Number(match[1]);
    if (!citationMap.has(num)) continue;

    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    parts.push(
      <button
        key={`${match.index}-${num}`}
        type="button"
        className="vchat-cite-chip"
        onClick={() => onCitationClick?.(num)}
        aria-label={`Source ${num}`}
      >
        {num}
      </button>,
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex === 0) return text;
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

function processChildren(children, citationMap, onCitationClick) {
  return Children.map(children, (child) => {
    if (typeof child === "string") {
      return renderTextWithCitations(child, citationMap, onCitationClick);
    }
    if (isValidElement(child) && child.props?.children) {
      if (child.type === "code" || child.type === "pre") {
        return child;
      }
      return cloneElement(child, {
        children: processChildren(
          child.props.children,
          citationMap,
          onCitationClick,
        ),
      });
    }
    return child;
  });
}

export default function MarkdownContent({
  content,
  citations = [],
  onCitationClick,
  isStreaming = false,
}) {
  const citationMap = useMemo(() => {
    const map = new Map();
    for (const c of citations) {
      if (c && typeof c.number === "number") {
        map.set(c.number, c);
      }
    }
    return map;
  }, [citations]);

  const components = useMemo(() => {
    const wrap = (Tag) =>
      function CitedTag({ children, ...props }) {
        return createElement(
          Tag,
          props,
          processChildren(children, citationMap, onCitationClick),
        );
      };

    return {
      p: wrap("p"),
      li: wrap("li"),
      td: wrap("td"),
      th: wrap("th"),
      blockquote: wrap("blockquote"),
    };
  }, [citationMap, onCitationClick]);

  return (
    <div
      className={`vchat-markdown ${isStreaming ? "vchat-markdown--streaming" : ""}`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
      {isStreaming && <span className="vchat-caret" aria-hidden="true" />}
    </div>
  );
}
