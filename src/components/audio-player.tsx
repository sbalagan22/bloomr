"use client";

import { useState, useRef, useCallback } from "react";

interface AudioPlayerProps {
  unitId: string;
  text: string;
}

export function AudioPlayer({ unitId, text }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const fetchAudio = useCallback(async () => {
    if (audioUrl) return audioUrl;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unitId, text }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate audio");
      }

      const data = await response.json();
      setAudioUrl(data.audioUrl);
      return data.audioUrl;
    } catch (err) {
      // Fallback to browser speech synthesis
      console.error("TTS error:", err);
      setError("Using browser speech instead");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [unitId, text, audioUrl]);

  const handlePlay = async () => {
    if (isPlaying) {
      // Pause
      if (audioRef.current) {
        audioRef.current.pause();
      } else {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
      return;
    }

    const url = await fetchAudio();

    if (url) {
      // Play via <audio>
      if (!audioRef.current) {
        audioRef.current = new Audio(url);
        audioRef.current.onended = () => setIsPlaying(false);
      }
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      // Fallback: browser TTS
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.onend = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  return (
    <button
      onClick={handlePlay}
      disabled={isLoading}
      className={`
        inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all
        ${
          isPlaying
            ? "bg-[#39AB54] text-white"
            : "bg-[#C8EDCF] text-[#2A8040] hover:bg-[#39AB54] hover:text-white"
        }
        ${isLoading ? "opacity-60 cursor-wait" : ""}
      `}
    >
      {isLoading ? (
        <>
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading...
        </>
      ) : isPlaying ? (
        <>
          {/* Animated sound bars */}
          <div className="flex items-end gap-0.5 h-4">
            <span className="w-0.5 bg-white rounded-full animate-bounce h-2" style={{ animationDelay: "0ms", animationDuration: "600ms" }} />
            <span className="w-0.5 bg-white rounded-full animate-bounce h-3" style={{ animationDelay: "150ms", animationDuration: "600ms" }} />
            <span className="w-0.5 bg-white rounded-full animate-bounce h-4" style={{ animationDelay: "300ms", animationDuration: "600ms" }} />
          </div>
          Pause
        </>
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
          Listen
        </>
      )}
      {error && <span className="text-xs opacity-70">({error})</span>}
    </button>
  );
}
