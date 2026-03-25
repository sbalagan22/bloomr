"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

export function MathText({ text, inline = false }: { text: string; inline?: boolean }) {
  // Pre-process \[ \] and \( \) blocks to standard $$ and $ formats
  // that remark-math natively prefers.
  const processedText = text
    .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$')
    .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');

  return (
    <div className={`math-markdown [&_.katex-display]:my-4 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:py-1 [&_.katex]:text-base ${inline ? "inline-block align-middle space-y-0" : "block"}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Tailwind styling fallback for basic markdown block elements
          p: ({ children }) => inline ? <span className="text-current inline">{children}</span> : <p className="mb-3 last:mb-0 leading-relaxed text-current">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-5 mb-3 text-current">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 text-current">{children}</ol>,
          li: ({ children }) => <li className="mb-1 text-current">{children}</li>,
          strong: ({ children }) => <strong className="font-bold text-current">{children}</strong>,
          em: ({ children }) => <em className="italic text-current">{children}</em>,
          // Support headers if the AI generates them
          h1: ({ children }) => <h1 className="text-xl font-bold mb-3 mt-4 text-current">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-3 text-current">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-bold mb-2 mt-2 text-current">{children}</h3>,
        }}
      >
        {processedText}
      </ReactMarkdown>
    </div>
  );
}
