"use client";

import { useState, useRef, useEffect } from "react";
import { MathText } from "@/components/math-text";
import { PiPaperPlaneRightBold, PiFlowerBold, PiUserBold } from "react-icons/pi";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatTutorProps {
  flowerId: string;
}

export function ChatTutor({ flowerId }: ChatTutorProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm Flowy, your personal AI assistant. Ask me anything about the study material!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flowerId,
          messages: newMessages.slice(1) // exclude the initial greeting if we want, or keep it. Let's keep it but mapped in route.
        }),
      });

      if (!res.ok) throw new Error("Failed to fetch response");
      
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { role: "assistant", content: "Oops, something went wrong connecting to the tutor." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-surface/85 backdrop-blur-xl rounded-3xl border border-white/20 pebble-shadow overflow-hidden pointer-events-auto">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10 bg-white/10 flex items-center gap-3">
        <div className="bg-primary-fixed text-on-primary-fixed p-2 rounded-xl shadow-sm">
          <PiFlowerBold className="text-xl" />
        </div>
        <div>
          <h3 className="font-heading font-bold text-on-surface">Flowy</h3>
          <p className="text-xs text-on-surface-variant">Your personal AI assistant</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center shadow-sm ${
              msg.role === "user" ? "bg-bloom-lavender text-white" : "bg-primary-fixed text-on-primary-fixed"
            }`}>
              {msg.role === "user" ? <PiUserBold /> : <PiFlowerBold />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
              msg.role === "user" 
                ? "bg-bloom-lavender text-white rounded-tr-sm" 
                : "bg-surface-container-high text-on-surface rounded-tl-sm"
            }`}>
              <div className="whitespace-pre-wrap">
                {msg.role === "user" ? msg.content : <MathText text={msg.content} />}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-primary-fixed text-on-primary-fixed shadow-sm">
              <PiFlowerBold />
            </div>
            <div className="bg-surface-container-high text-on-surface rounded-2xl rounded-tl-sm px-4 py-3 text-sm flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-on-surface-variant/50 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-on-surface-variant/50 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-on-surface-variant/50 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-surface-container-low border-t border-white/10">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask a question..."
            className="flex-1 bg-surface-container-lowest border border-white/20 rounded-full px-4 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-fixed transition-all placeholder:text-on-surface-variant/50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="h-10 w-10 shrink-0 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PiPaperPlaneRightBold />
          </button>
        </div>
      </div>
    </div>
  );
}
