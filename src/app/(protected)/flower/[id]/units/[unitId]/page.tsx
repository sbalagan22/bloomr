"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MermaidDiagram } from "@/components/mermaid-diagram";
import { AudioPlayer } from "@/components/audio-player";

interface UnitData {
  id: string;
  flower_id: string;
  title: string;
  order_index: number;
  content_json: {
    content: string;
    key_terms: { term: string; definition: string }[];
  };
  diagram_mermaid: string | null;
  completed: boolean;
}

interface FlowerData {
  id: string;
  topic_name: string;
  flower_type: string;
}

export default function UnitViewerPage() {
  const params = useParams();
  const router = useRouter();
  const flowerId = params.id as string;
  const unitId = params.unitId as string;

  const [unit, setUnit] = useState<UnitData | null>(null);
  const [flower, setFlower] = useState<FlowerData | null>(null);
  const [allUnits, setAllUnits] = useState<{ id: string; title: string; order_index: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUnit() {
      const supabase = createClient();

      const [unitResult, flowerResult, allUnitsResult] = await Promise.all([
        supabase.from("units").select("*").eq("id", unitId).single(),
        supabase.from("flowers").select("id, topic_name, flower_type").eq("id", flowerId).single(),
        supabase
          .from("units")
          .select("id, title, order_index")
          .eq("flower_id", flowerId)
          .order("order_index"),
      ]);

      if (!unitResult.data || !flowerResult.data) {
        router.push(`/flower/${flowerId}`);
        return;
      }

      setUnit(unitResult.data);
      setFlower(flowerResult.data);
      setAllUnits(allUnitsResult.data || []);
      setLoading(false);
    }

    loadUnit();
  }, [flowerId, unitId, router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-[#C8EDCF]" />
          <p className="mt-4 text-sm text-[#6B4C35]">Loading unit...</p>
        </div>
      </div>
    );
  }

  if (!unit || !flower) return null;

  const currentIndex = allUnits.findIndex((u) => u.id === unitId);
  const prevUnit = currentIndex > 0 ? allUnits[currentIndex - 1] : null;
  const nextUnit = currentIndex < allUnits.length - 1 ? allUnits[currentIndex + 1] : null;

  // Render content with highlighted key terms
  const renderContent = () => {
    let content = unit.content_json.content;
    const keyTerms = unit.content_json.key_terms || [];

    // Split content into paragraphs
    const paragraphs = content.split("\n").filter((p) => p.trim());

    return paragraphs.map((paragraph, i) => {
      // Check if any key terms appear in this paragraph
      let parts: (string | { term: string; definition: string })[] = [paragraph];

      for (const kt of keyTerms) {
        const newParts: (string | { term: string; definition: string })[] = [];
        for (const part of parts) {
          if (typeof part === "string") {
            const regex = new RegExp(`(${kt.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
            const splits = part.split(regex);
            for (const s of splits) {
              if (s.toLowerCase() === kt.term.toLowerCase()) {
                newParts.push({ term: s, definition: kt.definition });
              } else if (s) {
                newParts.push(s);
              }
            }
          } else {
            newParts.push(part);
          }
        }
        parts = newParts;
      }

      return (
        <p key={i} className="text-[#3D2B1F] leading-relaxed mb-4">
          {parts.map((part, j) => {
            if (typeof part === "string") {
              return <span key={j}>{part}</span>;
            }
            return (
              <Tooltip key={j}>
                <TooltipTrigger className="cursor-help rounded bg-[#C8EDCF] px-1 py-0.5 text-[#2A8040] font-medium decoration-dotted underline underline-offset-2 inline">
                  {part.term}
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-[#3D2B1F] text-white">
                  <p className="text-sm">{part.definition}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </p>
      );
    });
  };

  return (
    <div className="mx-auto max-w-4xl px-8 py-8 animate-fade-in-up bg-surface/80 backdrop-blur-xl rounded-[3rem] mt-4 lg:mt-8 border border-white/20 pebble-shadow pointer-events-auto mb-12">
      {/* Breadcrumb + progress */}
      <div className="mb-6">
        <Link
          href={`/flower/${flowerId}`}
          className="inline-flex items-center gap-1 text-sm text-[#6B4C35] hover:text-[#3D2B1F] transition-colors"
        >
          ← {flower.topic_name}
        </Link>

        {/* Unit progress bar */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-[#6B4C35]">
            Unit {currentIndex + 1} of {allUnits.length}
          </span>
          <div className="flex-1 h-1.5 bg-[#EDE8DE] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#39AB54] rounded-full transition-all"
              style={{ width: `${((currentIndex + 1) / allUnits.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Unit Title */}
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[#3D2B1F] sm:text-3xl mb-2">
        {unit.title}
      </h1>

      {/* Audio player */}
      <div className="mb-6">
        <AudioPlayer unitId={unit.id} text={unit.content_json.content} />
      </div>

      <Separator className="bg-[#C4BAA8] mb-6" />

      {/* Content area */}
      <div className="lg:flex lg:gap-8">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="prose prose-lg max-w-none">
            {renderContent()}
          </div>

          {/* Mermaid Diagram */}
          {unit.diagram_mermaid && (
            <div className="mt-8">
              <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#3D2B1F] mb-3">
                Concept Diagram
              </h3>
              <MermaidDiagram chart={unit.diagram_mermaid} />
            </div>
          )}
        </div>

        {/* Sidebar — Key Terms */}
        {unit.content_json.key_terms && unit.content_json.key_terms.length > 0 && (
          <aside className="mt-8 lg:mt-0 lg:w-72 flex-shrink-0">
            <div className="sticky top-20 rounded-2xl border border-[#C4BAA8] bg-[#EDE8DE] p-5">
              <h3 className="font-[family-name:var(--font-display)] text-base font-semibold text-[#3D2B1F] mb-3">
                Key Terms
              </h3>
              <ul className="space-y-3">
                {unit.content_json.key_terms.map((kt, i) => (
                  <li key={i}>
                    <Badge className="bg-[#C8EDCF] text-[#2A8040] hover:bg-[#C8EDCF] rounded-md font-medium mb-1">
                      {kt.term}
                    </Badge>
                    <p className="text-sm text-[#6B4C35] leading-snug">{kt.definition}</p>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-12 flex items-center justify-between gap-4">
        {prevUnit ? (
          <Link href={`/flower/${flowerId}/units/${prevUnit.id}`}>
            <Button
              variant="outline"
              className="rounded-full border-[#C4BAA8] text-[#3D2B1F] hover:bg-[#EDE8DE]"
            >
              ← {prevUnit.title}
            </Button>
          </Link>
        ) : (
          <div />
        )}

        <Link href={`/flower/${flowerId}/quiz/${unit.id}`}>
          <Button className="rounded-full bg-[#39AB54] text-white hover:bg-[#2A8040] px-6 font-semibold shadow-sm">
            Start Quiz →
          </Button>
        </Link>

        {nextUnit ? (
          <Link href={`/flower/${flowerId}/units/${nextUnit.id}`}>
            <Button
              variant="outline"
              className="rounded-full border-[#C4BAA8] text-[#3D2B1F] hover:bg-[#EDE8DE]"
            >
              {nextUnit.title} →
            </Button>
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
