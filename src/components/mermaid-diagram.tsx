"use client";

import { useEffect, useRef, useState } from "react";

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

export function MermaidDiagram({ chart, className = "" }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!chart || !containerRef.current) return;

    let cancelled = false;

    async function renderDiagram() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          themeVariables: {
            primaryColor: "#C8EDCF",
            primaryTextColor: "#3D2B1F",
            primaryBorderColor: "#39AB54",
            lineColor: "#6B4C35",
            secondaryColor: "#EDE8DE",
            tertiaryColor: "#F7F2EA",
            fontFamily: "DM Sans, system-ui, sans-serif",
            fontSize: "16px",
          },
        });

        const id = `mermaid-${Date.now()}`;
        
        // Auto-fix broken unquoted nodes that contain parentheses (e.g. A[Title (text)] -> A["Title (text)"])
        // Only matches if it's not already quoted.
        let sanitizedChart = chart.replace(/([A-Za-z0-9_-]+)\[([^"\]]+)\]/g, '$1["$2"]');

        const { svg } = await mermaid.render(id, sanitizedChart);

        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          setError(false);
        }
      } catch (err) {
        console.error("Mermaid render error:", err);
        if (!cancelled) setError(true);
      }
    }

    renderDiagram();
    return () => { cancelled = true; };
  }, [chart]);

  if (error) {
    return (
      <div className={`rounded-2xl border border-[#C4BAA8] bg-[#EDE8DE] p-4 text-sm text-[#6B4C35] ${className}`}>
        <p className="font-medium">Diagram could not be rendered</p>
        <pre className="mt-2 whitespace-pre-wrap text-xs font-mono opacity-70">{chart}</pre>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-x-auto rounded-2xl border border-[#C4BAA8] bg-white p-4 [&_svg]:mx-auto [&_svg]:min-w-[600px] ${className}`}
    />
  );
}
