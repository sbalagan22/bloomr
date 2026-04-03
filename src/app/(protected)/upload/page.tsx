"use client";

import { useState, useCallback, useRef, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import dynamic from "next/dynamic";
import {
  PiUploadSimpleBold,
  PiPlantBold,
  PiGiftBold,
  PiFilePdfBold,
  PiTextTBold,
  PiImageBold,
  PiMicrophoneBold,
  PiYoutubeLogoBold,
  PiStopBold,
} from "react-icons/pi";
import { FLOWER_ICON_MAP } from "@/components/flower-icons";
import { RARITIES, RARITY_ORDER, type Rarity } from "@/lib/rarity";
import { FlowerLoader } from "@/components/ui/flower-loader";

const Flower3D = dynamic(
  () => import("@/components/flower-3d").then((mod) => ({ default: mod.Flower3D })),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse bg-primary-fixed/20" /> }
);

const FLOWER_TYPES = [
  { name: "rose",      color: "#CC2A1A", label: "Rose" },
  { name: "tulip",     color: "#3D5EE0", label: "Tulip" },
  { name: "sunflower", color: "#F5C518", label: "Sunflower" },
  { name: "daisy",     color: "#F5C518", label: "Daisy" },
  { name: "lavender",  color: "#E8709A", label: "Lily" },
] as const;

type FlowerType = (typeof FLOWER_TYPES)[number]["name"];
type SourceType = "pdf" | "text" | "image" | "voice" | "youtube";

const SOURCE_TABS: { id: SourceType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "pdf", label: "PDF", icon: PiFilePdfBold },
  { id: "text", label: "Text", icon: PiTextTBold },
  { id: "image", label: "Image", icon: PiImageBold },
  { id: "voice", label: "Voice", icon: PiMicrophoneBold },
  { id: "youtube", label: "YouTube", icon: PiYoutubeLogoBold },
];

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Source type
  const [sourceType, setSourceType] = useState<SourceType>("pdf");

  // PDF state
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Text state
  const [textContent, setTextContent] = useState("");

  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // YouTube state
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeTranscript, setYoutubeTranscript] = useState("");
  const [isFetchingTranscript, setIsFetchingTranscript] = useState(false);

  // Common state
  const [topicName, setTopicName] = useState("");
  const [flowerType, setFlowerType] = useState<FlowerType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  // Preview states
  const [previewStage, setPreviewStage] = useState(3);
  const [previewRarity, setPreviewRarity] = useState<Rarity>("common");
  const [activePreviewId, setActivePreviewId] = useState<string>("base");
  const [customPotColor, setCustomPotColor] = useState<string>("#C8682B");

  const handlePreviewRarity = (id: string) => {
    setActivePreviewId(id);
    if (id === "base") {
      setPreviewStage(3);
    } else {
      setPreviewStage(4);
      setPreviewRarity(id as Rarity);
    }
  };

  useEffect(() => {
    if (!isSubmitting) { setCurrentStep(0); return; }
    const timers = [
      setTimeout(() => setCurrentStep(1), 3500),
      setTimeout(() => setCurrentStep(2), 8000),
      setTimeout(() => setCurrentStep(3), 14000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [isSubmitting]);

  useEffect(() => {
    async function checkProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("learner_profiles").select("id").eq("user_id", user.id).maybeSingle();
        if (!profile) {
          router.push("/onboarding");
        }
      }
    }
    checkProfile();
  }, [router]);

  // --- PDF handlers ---
  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") { setFile(droppedFile); setError(null); }
    else { setError("Only PDF files are supported in this tab."); }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") { setFile(selectedFile); setError(null); }
    else if (selectedFile) { setError("Only PDF files are supported in this tab."); }
  }, []);

  // --- Image handlers ---
  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select an image file (PNG, JPG, WEBP).");
      return;
    }
    if (selectedFile.size > 20 * 1024 * 1024) {
      setError("Image must be under 20MB.");
      return;
    }
    setImageFile(selectedFile);
    setImagePreview(URL.createObjectURL(selectedFile));
    setError(null);
  }, []);

  const handleImageDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith("image/")) {
      setImageFile(droppedFile);
      setImagePreview(URL.createObjectURL(droppedFile));
      setError(null);
    } else {
      setError("Please drop an image file.");
    }
  }, []);

  // --- Voice handlers ---
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SpeechRecognitionAPI = w.SpeechRecognition || w.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setError("Speech recognition is not supported in your browser. Try Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = voiceText;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interim = transcript;
        }
      }
      setVoiceText(finalTranscript + interim);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error !== "no-speech") {
        setError(`Mic error: ${event.error}. Please try again.`);
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setError(null);
  }, [isRecording, voiceText]);

  // --- YouTube handler ---
  const fetchYoutubeTranscript = useCallback(async () => {
    if (!youtubeUrl.trim()) return;
    setIsFetchingTranscript(true);
    setError(null);
    try {
      const res = await fetch(`/api/youtube-transcript?url=${encodeURIComponent(youtubeUrl.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch transcript");
      setYoutubeTranscript(data.transcript);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch transcript.");
    } finally {
      setIsFetchingTranscript(false);
    }
  }, [youtubeUrl]);

  // --- Form validity ---
  const hasContent = (() => {
    switch (sourceType) {
      case "pdf": return !!file;
      case "text": return textContent.trim().length > 50;
      case "image": return !!imageFile;
      case "voice": return voiceText.trim().length > 50;
      case "youtube": return youtubeTranscript.trim().length > 50;
    }
  })();

  const isFormValid = hasContent && topicName.trim() && flowerType;

  // --- Submit ---
  const handleSubmit = async () => {
    if (!isFormValid || !flowerType) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("You must be logged in to upload.");

      let processBody: Record<string, string>;

      if (sourceType === "pdf" && file) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("uploads").upload(fileName, file, { contentType: file.type });
        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
        processBody = { fileUrl: fileName, topicName: topicName.trim(), flowerType, sourceType: "pdf" };

      } else if (sourceType === "image" && imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("uploads").upload(fileName, imageFile, { contentType: imageFile.type });
        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
        processBody = { fileUrl: fileName, topicName: topicName.trim(), flowerType, sourceType: "image" };

      } else if (sourceType === "text") {
        processBody = { textContent, topicName: topicName.trim(), flowerType, sourceType: "text" };

      } else if (sourceType === "voice") {
        processBody = { textContent: voiceText, topicName: topicName.trim(), flowerType, sourceType: "text" };

      } else if (sourceType === "youtube") {
        processBody = { textContent: youtubeTranscript, topicName: topicName.trim(), flowerType, sourceType: "text" };

      } else {
        throw new Error("No content provided.");
      }

      const response = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(processBody),
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

  // Fullscreen Loading Overlay
  if (isSubmitting) {
    const GERMINATION_STEPS = [
      sourceType === "image" ? "Uploading your image" : sourceType === "pdf" ? "Uploading your file" : "Preparing your content",
      sourceType === "image" ? "Scanning content (OCR)" : "Reading your content",
      "Building study units",
      "Growing your flower",
    ];
    return (
      <div className="flex h-[calc(100vh-64px)] w-full items-center justify-center bg-surface px-4">
        <FlowerLoader text="Germinating..." subtext="AI is analyzing your study material">
          <div className="flex w-full flex-col gap-3">
            {GERMINATION_STEPS.map((step, index) => {
              const isCompleted = index < currentStep;
              const isActive = index === currentStep;
              return (
                <div
                  key={step}
                  className={`flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all duration-500
                    ${isActive ? "bg-[#3BAB55]/8 border border-[#3BAB55]/20" : ""}
                    ${isCompleted ? "opacity-50" : !isActive ? "opacity-20" : "opacity-100"}
                  `}
                >
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shrink-0 transition-all
                    ${isCompleted ? "bg-[#3BAB55] text-white" : isActive ? "bg-[#3BAB55]/15 text-[#3BAB55] border border-[#3BAB55]/30" : "bg-black/5 text-black/30"}
                  `}>
                    {isCompleted ? "✓" : index + 1}
                  </div>
                  <span className={`text-sm font-medium ${isActive ? "text-[#3BAB55]" : "text-[#3D2B1F]"}`}>{step}</span>
                  {isActive && <span className="ml-auto flex h-2 w-2 rounded-full bg-[#3BAB55] animate-ping" />}
                </div>
              );
            })}
          </div>
        </FlowerLoader>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] w-full bg-[#FAFAFA] overflow-hidden">

      {/* Left Panel: Form */}
      <div className="w-full lg:w-1/2 h-full overflow-y-auto px-6 py-10 lg:px-16 lg:py-12 scrollbar-hide flex flex-col justify-start animate-fade-in-up">
        <div className="max-w-xl mx-auto w-full">
          <h1 className="font-heading text-4xl lg:text-5xl font-extrabold text-[#3D2B1F] tracking-tight leading-tight">
            Plant a new <br/><span className="text-[#39AB54]">Topic Seed.</span>
          </h1>
          <p className="mt-3 text-base text-[#6B4C35] font-medium mb-8">Feed your study material and our AI will cultivate it into an interactive learning flower.</p>

          <div className="flex flex-col gap-6">

            {/* ── Source Type Tabs ── */}
            <div className="flex gap-1.5 p-1.5 bg-black/5 rounded-2xl">
              {SOURCE_TABS.map((tab) => {
                const Icon = tab.icon;
                const active = sourceType === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setSourceType(tab.id); setError(null); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all
                      ${active ? "bg-white text-[#39AB54] shadow-sm" : "text-[#8B6E59] hover:text-[#3D2B1F] hover:bg-white/50"}
                    `}
                  >
                    <Icon className="text-sm" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* ── Source Input Area ── */}
            <Card className="rounded-3xl border-0 pebble-shadow overflow-hidden bg-white/70 backdrop-blur-md">
              <CardContent className="p-0">

                {/* PDF Dropzone */}
                {sourceType === "pdf" && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative flex w-full cursor-pointer flex-col items-center justify-center p-10 transition-all duration-300 border-2 border-dashed
                      ${isDragging ? "border-[#39AB54] bg-[#C8EDCF]/30 scale-[1.02]" : file ? "border-[#39AB54] bg-[#C8EDCF]/10" : "border-transparent hover:border-[#39AB54]/50 hover:bg-[#C8EDCF]/5"}
                    `}
                  >
                    <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm transition-transform ${file ? "bg-[#39AB54] text-white scale-110" : "bg-white text-[#6B4C35]"}`}>
                      <PiFilePdfBold className="text-2xl" />
                    </div>
                    {file ? (
                      <div className="text-center">
                        <p className="font-bold text-[#3D2B1F]">{file.name}</p>
                        <p className="text-xs font-semibold text-[#8B6E59] mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        <p className="mt-2 text-xs font-bold text-[#39AB54] opacity-80">Click to replace</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="font-bold text-[#3D2B1F] text-lg">Drop your PDF here</p>
                        <p className="text-sm font-medium text-[#8B6E59] mt-1">or click to browse</p>
                        <Badge variant="outline" className="mt-3 bg-white/50 text-[#8B6E59] border-[#C4BAA8] rounded-full px-3">Max 10MB</Badge>
                      </div>
                    )}
                    <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" onChange={handleFileSelect} className="hidden" />
                  </button>
                )}

                {/* Text Input */}
                {sourceType === "text" && (
                  <div className="p-6">
                    <label className="mb-2 block text-sm font-bold text-[#3D2B1F]">Paste your study material</label>
                    <textarea
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      placeholder="Paste your lecture notes, textbook excerpts, or any study material here..."
                      className="w-full h-48 rounded-2xl border-0 bg-black/5 p-4 font-medium text-sm text-[#3D2B1F] placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-[#39AB54] focus:bg-white transition-all shadow-inner resize-none"
                    />
                    <p className="mt-2 text-xs text-[#8B6E59] font-medium">
                      {textContent.length} characters {textContent.trim().length < 50 && textContent.length > 0 && "— need at least 50"}
                    </p>
                  </div>
                )}

                {/* Image Upload */}
                {sourceType === "image" && (
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleImageDrop}
                    className={`relative flex w-full cursor-pointer flex-col items-center justify-center p-10 transition-all duration-300 border-2 border-dashed
                      ${isDragging ? "border-[#39AB54] bg-[#C8EDCF]/30 scale-[1.02]" : imageFile ? "border-[#39AB54] bg-[#C8EDCF]/10" : "border-transparent hover:border-[#39AB54]/50 hover:bg-[#C8EDCF]/5"}
                    `}
                  >
                    {imagePreview ? (
                      <div className="text-center">
                        <img src={imagePreview} alt="Preview" className="max-h-32 rounded-xl mx-auto mb-3 shadow-md" />
                        <p className="font-bold text-[#3D2B1F] text-sm">{imageFile?.name}</p>
                        <p className="mt-2 text-xs font-bold text-[#39AB54] opacity-80">Click to replace</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm bg-white text-[#6B4C35] mx-auto">
                          <PiImageBold className="text-2xl" />
                        </div>
                        <p className="font-bold text-[#3D2B1F] text-lg">Drop your image here</p>
                        <p className="text-sm font-medium text-[#8B6E59] mt-1">Whiteboard, notes, textbook photo</p>
                        <Badge variant="outline" className="mt-3 bg-white/50 text-[#8B6E59] border-[#C4BAA8] rounded-full px-3">PNG, JPG, WEBP (Max 20MB)</Badge>
                      </div>
                    )}
                    <input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageSelect} className="hidden" />
                  </button>
                )}

                {/* Voice Recording */}
                {sourceType === "voice" && (
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <button
                        onClick={toggleRecording}
                        className={`flex items-center gap-2 px-5 py-3 rounded-full font-bold text-sm transition-all shadow-md
                          ${isRecording
                            ? "bg-red-500 text-white animate-pulse shadow-red-200"
                            : "bg-[#39AB54] text-white hover:bg-[#2E8B44]"
                          }
                        `}
                      >
                        {isRecording ? (
                          <><PiStopBold className="text-lg" /> Stop Recording</>
                        ) : (
                          <><PiMicrophoneBold className="text-lg" /> Start Recording</>
                        )}
                      </button>
                      {isRecording && (
                        <span className="flex items-center gap-2 text-xs font-bold text-red-500">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                          Listening...
                        </span>
                      )}
                    </div>
                    <textarea
                      value={voiceText}
                      onChange={(e) => setVoiceText(e.target.value)}
                      placeholder="Your speech will appear here. You can also edit the text after recording..."
                      className="w-full h-40 rounded-2xl border-0 bg-black/5 p-4 font-medium text-sm text-[#3D2B1F] placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-[#39AB54] focus:bg-white transition-all shadow-inner resize-none"
                    />
                    <p className="mt-2 text-xs text-[#8B6E59] font-medium">
                      {voiceText.length} characters {voiceText.trim().length < 50 && voiceText.length > 0 && "— need at least 50"}
                    </p>
                  </div>
                )}

                {/* YouTube Input */}
                {sourceType === "youtube" && (
                  <div className="p-6">
                    <label className="mb-2 block text-sm font-bold text-[#3D2B1F]">YouTube Video URL</label>
                    <div className="flex gap-2">
                      <Input
                        type="url"
                        placeholder="https://youtube.com/watch?v=..."
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        className="flex-1 h-12 rounded-xl border-0 bg-black/5 px-4 font-medium text-sm text-[#3D2B1F] placeholder:text-black/30 focus-visible:ring-[#39AB54] focus-visible:bg-white transition-all shadow-inner"
                      />
                      <Button
                        onClick={fetchYoutubeTranscript}
                        disabled={!youtubeUrl.trim() || isFetchingTranscript}
                        className="h-12 px-5 rounded-xl gradient-cta text-white font-bold disabled:opacity-40"
                      >
                        {isFetchingTranscript ? "Fetching..." : "Get Transcript"}
                      </Button>
                    </div>
                    {youtubeTranscript && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-bold text-[#39AB54]">Transcript fetched</label>
                          <span className="text-xs text-[#8B6E59] font-medium">{youtubeTranscript.length} characters</span>
                        </div>
                        <textarea
                          value={youtubeTranscript}
                          onChange={(e) => setYoutubeTranscript(e.target.value)}
                          className="w-full h-36 rounded-2xl border-0 bg-[#C8EDCF]/20 p-4 font-medium text-xs text-[#3D2B1F] focus:outline-none focus:ring-2 focus:ring-[#39AB54] transition-all shadow-inner resize-none"
                        />
                      </div>
                    )}
                    {!youtubeTranscript && (
                      <p className="mt-3 text-xs text-[#8B6E59] font-medium">
                        Paste a YouTube URL and click &quot;Get Transcript&quot; to extract the video captions.
                      </p>
                    )}
                  </div>
                )}

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
                <span className="text-xs font-medium text-black/40 hidden lg:block">Visual preview on right</span>
              </label>
              <div className="grid grid-cols-5 gap-3">
                {FLOWER_TYPES.map((flower) => {
                  const IconComponent = FLOWER_ICON_MAP[flower.name];
                  return (
                    <button
                      key={flower.name}
                      type="button"
                      onClick={() => setFlowerType(flower.name)}
                      className={`
                        relative group flex flex-col items-center gap-2 rounded-2xl p-3 transition-all duration-300
                        ${flowerType === flower.name ? "bg-[#39AB54]/10 shadow-sm border border-[#39AB54]/30 scale-105" : "hover:bg-black/5 border border-transparent"}
                      `}
                    >
                      {IconComponent ? (
                        <div className="h-12 w-12 flex items-center justify-center">
                          <IconComponent className="w-11 h-11" />
                        </div>
                      ) : (
                        <div className="h-12 w-12 rounded-full shadow-inner border-2 border-white" style={{ backgroundColor: flower.color }} />
                      )}
                      <span className={`text-[11px] sm:text-xs font-bold ${flowerType === flower.name ? "text-[#39AB54]" : "text-[#8B6E59]"}`}>
                        {flower.label}
                      </span>
                    </button>
                  );
                })}
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
        <div className="absolute top-10 left-10 text-4xl font-heading font-extrabold text-[#39AB54]/20 tracking-tighter mix-blend-multiply">Bloomr Setup</div>

        {flowerType ? (
          <div className="w-full h-full cursor-grab active:cursor-grabbing animate-fade-in">
            <Suspense fallback={<div className="h-full w-full animate-pulse bg-primary-fixed/20" />}>
              <Flower3D
                flowerType={flowerType}
                growthStage={previewStage}
                rarity={previewRarity}
                potColor={customPotColor}
                size="full"
                interactive={true}
              />
            </Suspense>

            {/* Pot Drops Preview Panel */}
            <div className="absolute top-10 right-10 bg-white/70 backdrop-blur-xl p-5 rounded-3xl shadow-lg border border-white/40 w-64 animate-fade-in-down pointer-events-auto">
              <h3 className="text-sm font-bold text-[#3D2B1F] mb-3 flex items-center gap-2">
                <PiGiftBold className="text-[#D4722A] text-lg" /> Pot Drops Preview
              </h3>
              <div className="space-y-2">
                <button onClick={() => handlePreviewRarity("base")} className={`w-full flex justify-between items-center text-xs font-bold px-3 py-2 rounded-xl transition-all ${activePreviewId === "base" ? "bg-[#39AB54]/10 border border-[#39AB54]/30 shadow-sm" : "hover:bg-black/5 border border-transparent"}`}>
                  <span className="text-gray-600">Base Preview</span>
                  <span className="text-[#8B6E59] opacity-60">-</span>
                </button>
                {RARITY_ORDER.map((rarity) => {
                  const config = RARITIES[rarity];
                  return (
                    <button
                      key={rarity}
                      onClick={() => handlePreviewRarity(rarity)}
                      className={`w-full flex justify-between items-center text-xs font-bold px-3 py-2 rounded-xl transition-all ${
                        activePreviewId === rarity
                          ? `${config.bgClass} ${config.borderClass} border shadow-sm`
                          : "hover:bg-black/5 border border-transparent"
                      }`}
                    >
                      <span className={`${config.textClass} flex items-center gap-1.5`}>
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${rarity === "legendary" ? "shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse" : ""}`}
                          style={{ backgroundColor: config.color }}
                        />
                        {config.name}
                      </span>
                      <span>{config.dropRate}%</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-[#8B6E59] mt-3.5 leading-tight font-medium text-center opacity-80">
                Click rarities to preview pot camos.
              </p>

              {/* Color picker */}
              {activePreviewId !== "base" && (
                <div className="mt-4 pt-4 border-t border-black/5">
                  <label className="text-[10px] font-bold text-[#8B6E59] uppercase tracking-wider block mb-2">Test Pot Color</label>
                  <input
                    type="color"
                    value={customPotColor}
                    onChange={(e) => setCustomPotColor(e.target.value)}
                    className="w-full h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                  />
                  <div className="mt-2 bg-amber-50 border border-amber-200 rounded-md p-2 flex items-start gap-1.5 shadow-sm">
                    <span className="text-amber-500 text-xs mt-0.5">⚠️</span>
                    <p className="text-[10px] text-amber-800 leading-tight font-medium">
                      Color is chosen <span className="font-bold">randomly</span> upon bloom. The picker above is just for testing!
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/70 backdrop-blur-xl px-6 py-3 rounded-full shadow-lg border border-white/40 pointer-events-none text-center">
              <p className="text-sm font-bold text-[#3D2B1F]">
                {activePreviewId === "base" ? "Full Bloom (Stage 3)" : `${RARITIES[activePreviewId as Rarity]?.name ?? ""} Pot (Stage 4)`}
              </p>
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
