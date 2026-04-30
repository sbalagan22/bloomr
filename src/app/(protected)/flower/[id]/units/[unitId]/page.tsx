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
import { PiGraphBold, PiBookmarksBold, PiArrowLeftBold, PiArrowRightBold, PiDownloadSimpleBold, PiBookOpenBold } from "react-icons/pi";
import { FlowerLoader } from "@/components/ui/flower-loader";
import { usePlan } from "@/hooks/use-plan";

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
  const { plan } = usePlan();

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
        <FlowerLoader text="Gathering notes..." subtext="Assembling the unit topic knowledge" />
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
        <p key={i} className="text-[#1A4D2E]/90 leading-[1.8] mb-6 text-lg font-medium">
          {parts.map((part, j) => {
            if (typeof part === "string") return <span key={j}>{part}</span>;
            return (
              <Tooltip key={j}>
                <TooltipTrigger className="cursor-help rounded-md bg-[#39AB54]/15 px-1.5 py-0.5 text-[#2A8040] font-bold decoration-dotted underline underline-offset-4 inline transition-colors hover:bg-[#39AB54]/30">
                  {part.term}
                </TooltipTrigger>
                <TooltipContent className="max-w-sm bg-[#1A4D2E] text-white p-3 rounded-xl shadow-2xl border border-white/10">
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
    <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-8 animate-fade-in-up bg-white rounded-[3rem] mt-6 lg:mt-10 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)] pointer-events-auto mb-12">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <Link href={`/flower/${flowerId}`} className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#39AB54] transition-colors mb-2 bg-gray-50 px-4 py-1.5 rounded-full w-fit border border-gray-200 shadow-sm">
            <PiArrowLeftBold /> {flower.topic_name}
          </Link>
          <h1 className="font-heading text-3xl md:text-5xl font-extrabold text-[#0D2419] tracking-tight mt-1">
            {unit.title}
          </h1>
        </div>
        
        {/* Progress Badge + Export */}
        <div className="flex items-center gap-3 shrink-0">
          {plan === "pro" && (
            <button
              onClick={() => window.print()}
              title="Export as PDF"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-[#0D2419] shadow-sm text-sm font-bold hover:border-[#39AB54]/40 hover:bg-[#39AB54]/5 transition-all print:hidden"
            >
              <PiDownloadSimpleBold className="text-[#39AB54]" /> Export PDF
            </button>
          )}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 shadow-sm min-w-[200px]">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Lesson {currentIndex + 1} of {allUnits.length}</span>
            <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
              <div className="h-full bg-[#39AB54] rounded-full transition-all duration-700" style={{ width: `${((currentIndex + 1) / allUnits.length) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      <Separator className="bg-black/10 mb-8" />

      {/* ── LISTEN (TOP) ── */}
      <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 shadow-sm mb-8">
        <h3 className="font-heading text-lg font-bold text-[#0D2419] mb-4 flex items-center gap-2">
          Listen to Lesson
        </h3>
        <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-200">
          <AudioPlayer unitId={unit.id} text={unit.content_json.content} />
        </div>
      </div>

      {/* Main Content Column */}
      <div className="flex flex-col gap-10">

        {/* Notes Content */}
        <div className="bg-white border border-gray-100 rounded-3xl p-8 md:p-12 shadow-sm relative">
          <div className="absolute top-0 left-0 w-2 h-full bg-[#39AB54] rounded-l-3xl" />
          <h3 className="font-heading text-2xl font-bold text-[#0D2419] mb-8 flex items-center gap-3">
            <PiBookOpenBold className="text-[#39AB54]" /> Reading Material
          </h3>
          <div className="prose prose-lg max-w-none text-gray-700">
            {renderContent()}
          </div>
        </div>

        {/* Key Vocabulary */}
        {unit.content_json.key_terms && unit.content_json.key_terms.length > 0 && (
          <div className="bg-amber-50 rounded-3xl p-8 border border-amber-100 shadow-sm">
            <h3 className="font-heading text-xl font-bold text-amber-900 mb-6 flex items-center gap-3">
              <PiBookmarksBold className="text-amber-500 text-2xl" />
              Key Vocabulary
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {unit.content_json.key_terms.map((kt, i) => (
                <li key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-amber-50 hover:border-amber-200 transition-colors flex flex-col justify-start">
                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 rounded-md font-bold mb-3 text-sm px-3 py-1 w-fit shadow-sm">
                    {kt.term}
                  </Badge>
                  <p className="text-[14px] font-medium text-gray-600 leading-relaxed">{kt.definition}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Concept Map — bottom of content */}
        {unit.diagram_mermaid && (
          <div className="bg-blue-50 rounded-3xl p-6 border border-blue-100 shadow-sm">
            <h3 className="font-heading text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
              <PiGraphBold className="text-blue-500 text-xl" />
              Concept Map
            </h3>
            <div className="bg-white rounded-2xl p-4 overflow-x-auto shadow-sm border border-blue-50 min-h-[300px] flex items-center justify-center">
              <MermaidDiagram chart={unit.diagram_mermaid} />
            </div>
          </div>
        )}

      </div>

      {/* Navigation Buttons */}
      <div className="mt-16 max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-black/5 pt-8">
        {prevUnit ? (
          <Link href={`/flower/${flowerId}/units/${prevUnit.id}`} className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto rounded-full border-gray-200 text-[#0D2419] bg-white hover:bg-gray-50 h-12 px-6 font-bold shadow-sm">
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
            <Button variant="outline" className="w-full sm:w-auto rounded-full border-gray-200 text-[#0D2419] bg-white hover:bg-gray-50 h-12 px-6 font-bold shadow-sm">
              {nextUnit.title} <PiArrowRightBold className="ml-2" />
            </Button>
          </Link>
        ) : <div className="hidden sm:block" />}
      </div>
    </div>
  );
}
