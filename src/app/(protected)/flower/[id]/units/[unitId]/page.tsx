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
import { PiGraphBold, PiBookmarksBold, PiArrowLeftBold, PiArrowRightBold } from "react-icons/pi";

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
  const router = useRouter(); // Used for missing data redirects
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
        supabase.from("units").select("id, title, order_index").eq("flower_id", flowerId).order("order_index"),
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
          <div className="mx-auto h-16 w-16 animate-pulse rounded-full bg-[#C8EDCF]" />
          <p className="mt-4 text-sm font-bold text-[#6B4C35] animate-pulse">Gathering unit notes...</p>
        </div>
      </div>
    );
  }

  if (!unit || !flower) return null;

  const currentIndex = allUnits.findIndex((u) => u.id === unitId);
  const prevUnit = currentIndex > 0 ? allUnits[currentIndex - 1] : null;
  const nextUnit = currentIndex < allUnits.length - 1 ? allUnits[currentIndex + 1] : null;

  const renderContent = () => {
    const content = unit.content_json.content;
    const keyTerms = unit.content_json.key_terms || [];
    const paragraphs = content.split("\n").filter((p) => p.trim());

    return paragraphs.map((paragraph, i) => {
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
        <p key={i} className="text-[#3D2B1F] leading-[1.8] mb-6 text-lg">
          {parts.map((part, j) => {
            if (typeof part === "string") return <span key={j}>{part}</span>;
            return (
              <Tooltip key={j}>
                <TooltipTrigger className="cursor-help rounded-md bg-[#39AB54]/10 px-1.5 py-0.5 text-[#2A8040] font-bold decoration-dotted underline underline-offset-4 inline transition-colors hover:bg-[#39AB54]/20">
                  {part.term}
                </TooltipTrigger>
                <TooltipContent className="max-w-sm bg-[#3D2B1F] text-white p-3 rounded-xl shadow-xl">
                  <p className="text-sm font-medium leading-relaxed">{part.definition}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </p>
      );
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 animate-fade-in-up bg-surface/90 backdrop-blur-2xl rounded-[3rem] mt-6 lg:mt-10 border border-white/40 pebble-shadow pointer-events-auto mb-12">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <Link href={`/flower/${flowerId}`} className="inline-flex items-center gap-2 text-sm font-bold text-[#6B4C35] hover:text-[#39AB54] transition-colors mb-2 bg-white/50 px-3 py-1 rounded-full w-fit">
            <PiArrowLeftBold /> {flower.topic_name}
          </Link>
          <h1 className="font-heading text-3xl md:text-5xl font-extrabold text-[#3D2B1F] tracking-tight">
            {unit.title}
          </h1>
        </div>
        
        {/* Progress Badge */}
        <div className="flex flex-col items-end shrink-0 bg-white/50 p-4 rounded-2xl border border-white/50">
          <span className="text-xs font-bold text-[#6B4C35] mb-2">Lesson {currentIndex + 1} of {allUnits.length}</span>
          <div className="w-32 h-2.5 bg-[#C4BAA8]/30 rounded-full overflow-hidden shadow-inner">
            <div className="h-full bg-[#39AB54] rounded-full transition-all duration-700" style={{ width: `${((currentIndex + 1) / allUnits.length) * 100}%` }} />
          </div>
        </div>
      </div>

      <Separator className="bg-black/10 mb-8" />

      {/* Main Study Area */}
      <div className="flex flex-col lg:flex-row gap-10">
        
        {/* Left Column: Audio & Text Content */}
        <div className="flex-1 min-w-0 order-2 lg:order-1">
          <div className="mb-10 sticky top-4 z-20">
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-2 shadow-sm border border-white/60">
              <AudioPlayer unitId={unit.id} text={unit.content_json.content} />
            </div>
          </div>

          <div className="prose prose-lg max-w-none">
            {renderContent()}
          </div>


        </div>

        {/* Right Column: Visuals (only) */}
        <div className="lg:w-[480px] shrink-0 flex flex-col gap-6 order-1 lg:order-2">
          
          {/* Diagrams Pane */}
          {unit.diagram_mermaid && (
            <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 border border-white/60 pebble-shadow sticky top-24">
              <h3 className="font-heading text-xl font-extrabold text-[#3D2B1F] mb-4 flex items-center gap-2">
                <div className="p-2 bg-[#39AB54]/10 rounded-xl"><PiGraphBold className="text-[#39AB54] text-xl" /></div>
                Concept Map
              </h3>
              <div className="bg-white rounded-2xl p-5 overflow-x-auto shadow-inner border border-black/5 min-h-[300px] flex items-center justify-center">
                <MermaidDiagram chart={unit.diagram_mermaid} />
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Full-Width Horizontal Key Terms */}
      {unit.content_json.key_terms && unit.content_json.key_terms.length > 0 && (
        <div className="mt-16 bg-white/60 backdrop-blur-xl rounded-3xl p-8 border border-white/60 pebble-shadow">
          <h3 className="font-heading text-xl font-extrabold text-[#3D2B1F] mb-6 flex items-center gap-2">
            <div className="p-2 bg-[#F5D03B]/20 rounded-xl"><PiBookmarksBold className="text-[#D4722A] text-xl" /></div>
            Study Vocabulary
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {unit.content_json.key_terms.map((kt, i) => (
              <li key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-black/5 hover:border-[#39AB54]/30 transition-colors flex flex-col justify-start">
                <Badge className="bg-[#C8EDCF] text-[#2A8040] hover:bg-[#C8EDCF] rounded-md font-bold mb-3 text-sm px-3 py-1 w-fit">
                  {kt.term}
                </Badge>
                <p className="text-[15px] font-medium text-[#6B4C35] leading-relaxed">{kt.definition}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="mt-16 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-black/10 pt-8">
        {prevUnit ? (
          <Link href={`/flower/${flowerId}/units/${prevUnit.id}`} className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto rounded-full border-[#C4BAA8] text-[#3D2B1F] hover:bg-[#EDE8DE] h-12 px-6 font-bold">
              <PiArrowLeftBold className="mr-2" /> {prevUnit.title}
            </Button>
          </Link>
        ) : <div className="hidden sm:block" />}

        <Link href={`/flower/${flowerId}/quiz/${unitId}`} className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto h-14 rounded-full gradient-cta text-white shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all px-10 text-lg font-extrabold tracking-wide">
            Start Lesson Quiz <PiArrowRightBold className="ml-2" />
          </Button>
        </Link>

        {nextUnit ? (
          <Link href={`/flower/${flowerId}/units/${nextUnit.id}`} className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto rounded-full border-[#C4BAA8] text-[#3D2B1F] hover:bg-[#EDE8DE] h-12 px-6 font-bold">
              {nextUnit.title} <PiArrowRightBold className="ml-2" />
            </Button>
          </Link>
        ) : <div className="hidden sm:block" />}
      </div>
    </div>
  );
}
