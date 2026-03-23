"use client";

import { useState, useCallback, useRef, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import dynamic from "next/dynamic";
import { PiUploadSimpleBold, PiPlantBold } from "react-icons/pi";

const Flower3D = dynamic(
  () => import("@/components/flower-3d").then((mod) => ({ default: mod.Flower3D })),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse bg-primary-fixed/20" /> }
);

const FLOWER_TYPES = [
  { name: "rose", color: "#E8637A", label: "Rose" },
  { name: "tulip", color: "#F4A44E", label: "Tulip" },
  { name: "sunflower", color: "#F5D03B", label: "Sunflower" },
  { name: "daisy", color: "#A8D8EA", label: "Daisy" },
  { name: "lavender", color: "#B09FD8", label: "Lavender" },
] as const;

type FlowerType = (typeof FLOWER_TYPES)[number]["name"];

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [topicName, setTopicName] = useState("");
  const [flowerType, setFlowerType] = useState<FlowerType | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  // Pattern offset seeds for the preview (randomized on mount)
  const [previewOffset] = useState({ x: Math.random(), y: Math.random() });

  useEffect(() => {
    if (!isSubmitting) {
      setCurrentStep(0);
      return;
    }
    const timers = [
      setTimeout(() => setCurrentStep(1), 3500),
      setTimeout(() => setCurrentStep(2), 8000),
      setTimeout(() => setCurrentStep(3), 14000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [isSubmitting]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile); setError(null);
    } else {
      setError("Only PDF files are supported right now.");
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile); setError(null);
    } else if (selectedFile) {
      setError("Only PDF files are supported right now.");
    }
  }, []);

  const handleSubmit = async () => {
    if (!file || !topicName.trim() || !flowerType) return;
    setIsSubmitting(true); setError(null);

    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("You must be logged in to upload.");

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from("uploads").upload(fileName, file, { contentType: file.type });
      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      const response = await fetch("/api/gemini/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl: fileName, topicName: topicName.trim(), flowerType }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Processing failed (${response.status})`);
      }

      const { flowerId } = await response.json();
      router.push(`/flower/${flowerId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsSubmitting(false);
    }
  };

  const isFormValid = file && topicName.trim() && flowerType;

  // Fullscreen Loading Overlay
  if (isSubmitting) {
    const GERMINATION_STEPS = ["Uploading your file •", "Reading your content •", "Building study units •", "Growing your flower •"];
    return (
      <div className="flex h-[calc(100vh-64px)] w-full items-center justify-center bg-surface-container-lowest px-4">
        <div className="flex w-full max-w-sm flex-col items-center gap-10 text-center bg-white/70 backdrop-blur-xl p-10 rounded-3xl pebble-shadow border border-white/50">
          <div className="relative flex h-24 w-24 items-center justify-center">
            <svg className="absolute left-0 top-0 h-full w-full animate-spin" style={{ animationDuration: "2s", animationTimingFunction: "linear" }} viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#C8EDCF" strokeWidth="4" />
              <circle cx="60" cy="60" r="54" fill="none" stroke="#39AB54" strokeWidth="4" strokeDasharray="80 260" strokeLinecap="round" />
            </svg>
            <PiPlantBold className="text-4xl text-primary-deep animate-pulse" />
          </div>
          <div>
            <h2 className="font-heading text-2xl font-bold text-[#3D2B1F]">Germinating...</h2>
            <p className="mt-2 text-sm text-[#6B4C35]">AI is analyzing your lecture content.</p>
          </div>
          <div className="flex w-full flex-col gap-3">
            {GERMINATION_STEPS.map((step, index) => {
              const isCompleted = index < currentStep;
              const isActive = index === currentStep;
              return (
                <div key={step} className={`flex items-center gap-3 transition-opacity duration-500 ${isActive ? "opacity-100" : isCompleted ? "opacity-40" : "opacity-10"}`}>
                  <span className={`text-sm font-bold ${isActive ? "text-[#39AB54]" : "text-[#3D2B1F]"}`}>{step}</span>
                  {isActive && <span className="flex h-2 w-2 rounded-full bg-[#39AB54] animate-ping" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] w-full bg-[#FAFAFA] overflow-hidden">
      
      {/* Left Panel: Form */}
      <div className="w-full lg:w-1/2 h-full overflow-y-auto px-6 py-10 lg:px-16 lg:py-16 scrollbar-hide flex flex-col justify-center animate-fade-in-up">
        <div className="max-w-xl mx-auto w-full">
          <h1 className="font-heading text-4xl lg:text-5xl font-extrabold text-[#3D2B1F] tracking-tight leading-tight">
            Plant a new <br/><span className="text-[#39AB54]">Topic Seed.</span>
          </h1>
          <p className="mt-3 text-base text-[#6B4C35] font-medium mb-10">Upload your PDF lecture notes and our AI will cultivate them into an interactive learning flower.</p>

          <div className="flex flex-col gap-8">
            {/* File Dropzone */}
            <Card className="rounded-3xl border-0 pebble-shadow overflow-hidden bg-white/70 backdrop-blur-md">
              <CardContent className="p-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative flex w-full cursor-pointer flex-col items-center justify-center p-10 transition-all duration-300 border-2 border-dashed mx-auto
                    ${isDragging ? "border-[#39AB54] bg-[#C8EDCF]/30 scale-[1.02]" : file ? "border-[#39AB54] bg-[#C8EDCF]/10" : "border-transparent hover:border-[#39AB54]/50 hover:bg-[#C8EDCF]/5"}
                  `}
                >
                  <div className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm transition-transform ${file ? "bg-[#39AB54] text-white scale-110" : "bg-white text-[#6B4C35]"}`}>
                    <PiUploadSimpleBold className="text-3xl" />
                  </div>
                  {file ? (
                    <div className="text-center">
                      <p className="font-bold text-[#3D2B1F]">{file.name}</p>
                      <p className="text-xs font-semibold text-[#8B6E59] mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      <p className="mt-3 text-xs font-bold text-[#39AB54] opacity-80">Click to replace file</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="font-bold text-[#3D2B1F] text-lg">Drop your PDF here</p>
                      <p className="text-sm font-medium text-[#8B6E59] mt-1">or click to browse</p>
                      <Badge variant="outline" className="mt-4 bg-white/50 text-[#8B6E59] border-[#C4BAA8] rounded-full px-3">PDF only (Max 10MB)</Badge>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" onChange={handleFileSelect} className="hidden" />
                </button>
              </CardContent>
            </Card>

            {/* Topic Input */}
            <div className="bg-white/70 backdrop-blur-md p-6 rounded-3xl pebble-shadow border border-white/40">
              <label className="mb-2 block text-sm font-bold text-[#3D2B1F]">Subject / Topic Name</label>
              <Input
                type="text"
                placeholder="e.g. Molecular Biology Ch. 4"
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                className="h-14 rounded-2xl border-0 bg-black/5 px-5 font-medium text-base text-[#3D2B1F] placeholder:text-black/30 focus-visible:ring-[#39AB54] focus-visible:bg-white transition-all shadow-inner"
              />
            </div>

            {/* Flower Type Selector */}
            <div className="bg-white/70 backdrop-blur-md p-6 rounded-3xl pebble-shadow border border-white/40">
              <label className="mb-4 block text-sm font-bold text-[#3D2B1F] flex justify-between items-center">
                <span>Choose your flower species</span>
                <span className="text-xs font-medium text-black/40">Visual preview on right</span>
              </label>
              <div className="grid grid-cols-5 gap-3">
                {FLOWER_TYPES.map((flower) => (
                  <button
                    key={flower.name}
                    type="button"
                    onClick={() => setFlowerType(flower.name)}
                    className={`
                      relative group flex flex-col items-center gap-3 rounded-2xl p-4 transition-all duration-300
                      ${flowerType === flower.name ? "bg-[#39AB54]/10 shadow-sm border border-[#39AB54]/30 scale-105" : "hover:bg-black/5 border border-transparent"}
                    `}
                  >
                    <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full transition-transform shadow-inner border-2 border-white`} style={{ backgroundColor: flower.color }} />
                    <span className={`text-[11px] sm:text-xs font-bold ${flowerType === flower.name ? "text-[#39AB54]" : "text-[#8B6E59]"}`}>
                      {flower.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-[#E8637A]/30 bg-[#E8637A]/10 px-5 py-4">
                <p className="text-sm font-bold text-[#E8637A]">{error}</p>
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={!isFormValid}
              className={`h-16 w-full rounded-full text-lg font-bold text-white transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1
                ${isFormValid ? "gradient-cta" : "bg-black/10 text-black/40 shadow-none cursor-not-allowed hover:translate-y-0"}`}
            >
              Plant Your Seed
            </Button>
          </div>
        </div>
      </div>

      {/* Right Panel: 3D Preview */}
      <div className="hidden lg:block lg:w-1/2 h-full relative bg-[#E6F4EA] overflow-hidden rounded-l-[3rem] shadow-[inset_10px_0_30px_rgba(0,0,0,0.05)]">
        {/* Soft decorative background elements */}
        <div className="absolute top-10 left-10 text-4xl font-heading font-extrabold text-[#39AB54]/20 tracking-tighter mix-blend-multiply">Bloomr Setup</div>
        
        {flowerType ? (
          <div className="w-full h-full cursor-grab active:cursor-grabbing animate-fade-in">
            <Suspense fallback={<div className="h-full w-full animate-pulse bg-primary-fixed/20" />}>
              <Flower3D 
                flowerType={flowerType} 
                growthStage={4} // Always show full bloom preview
                patternOffsetX={previewOffset.x}
                patternOffsetY={previewOffset.y}
                size="full"
                interactive={true}
              />
            </Suspense>
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/70 backdrop-blur-xl px-6 py-3 rounded-full shadow-lg border border-white/40 pointer-events-none text-center">
              <p className="text-sm font-bold text-[#3D2B1F]">Full Bloom Preview</p>
              <p className="text-xs font-medium text-[#6B4C35] mt-0.5">Drag to inspect geometry</p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center flex-col gap-6 opacity-60">
            <PiPlantBold className="text-9xl text-[#C8EDCF]" />
            <p className="font-heading font-bold text-2xl text-[#8DB499]">Select a flower type<br/>to generate a 3D preview.</p>
          </div>
        )}
      </div>

    </div>
  );
}
