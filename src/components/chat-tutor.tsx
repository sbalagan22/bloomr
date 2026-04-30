"use client";

import { useState, useRef, useEffect } from "react";
import { MathText } from "@/components/math-text";
import { PiPaperPlaneRightBold, PiFlowerBold, PiUserBold, PiSparkle } from "react-icons/pi";
import { usePlan } from "@/hooks/use-plan";
import { UpgradeModal } from "@/components/upgrade-modal";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatTutorProps {
  flowerId: string;
}

const FREE_DAILY_LIMIT = 10;

export function ChatTutor({ flowerId }: ChatTutorProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm Flowy, your personal AI assistant. Ask me anything about the study material!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [dailyUsed, setDailyUsed] = useState(0);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { plan } = usePlan();

  const isAtLimit = plan === "free" && dailyUsed >= FREE_DAILY_LIMIT;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading || isAtLimit) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flowerId, messages: newMessages.slice(1) }),
      });

      if (res.status === 403) {
        const data = await res.json();
        if (data.error === "FLOWY_LIMIT_REACHED") {
          setDailyUsed(data.used);
          setShowUpgrade(true);
          setMessages((prev) => prev.slice(0, -1)); // remove the user msg we added optimistically
          setInput(userMsg.content); // restore input
          return;
        }
      }

      if (!res.ok) throw new Error("Failed to fetch response");

      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      if (data.used !== undefined) setDailyUsed(data.used);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { role: "assistant", content: "Oops, something went wrong connecting to Flowy." }]);
    } finally {
      setLoading(false);
    }
  };

  const remaining = FREE_DAILY_LIMIT - dailyUsed;

  return (
    <div className="flex flex-col h-full w-full bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden pointer-events-auto">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
        <div className="bg-[#39AB54] text-white p-2 rounded-xl shadow-sm">
          <PiFlowerBold className="text-xl" />
        </div>
        <div className="flex-1">
          <h3 className="font-heading font-bold text-[#0D2419]">Flowy</h3>
          <p className="text-xs text-[#0D2419]/60">Your personal AI assistant</p>
        </div>
        {plan === "free" && (
          <div className="text-right">
            <p className="text-[10px] font-bold text-[#0D2419]/70">
              {remaining > 0 ? `${remaining} msgs left today` : "Limit reached"}
            </p>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center shadow-sm border ${
              msg.role === "user" ? "bg-gray-100 text-[#0D2419] border-gray-200" : "bg-[#39AB54] text-white border-[#39AB54]/50"
            }`}>
              {msg.role === "user" ? <PiUserBold /> : <PiFlowerBold />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm border ${
              msg.role === "user"
                ? "bg-[#39AB54]/10 text-[#0D2419] rounded-tr-sm border-[#39AB54]/20 shadow-sm"
                : "bg-white text-[#0D2419] rounded-tl-sm border-gray-100 shadow-sm"
            }`}>
              <div className="whitespace-pre-wrap flex flex-col">
                {msg.role === "user" ? msg.content : <MathText text={msg.content} />}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-[#39AB54] text-white shadow-sm border border-[#39AB54]/50">
              <PiFlowerBold />
            </div>
            <div className="bg-white border border-gray-100 text-[#0D2419] rounded-2xl rounded-tl-sm px-4 py-3 text-sm flex items-center gap-1 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#39AB54]/60 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-[#39AB54]/60 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-[#39AB54]/60 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Limit banner */}
      {isAtLimit && (
        <div className="mx-4 mb-2 rounded-2xl bg-[#39AB54]/10 border border-[#39AB54]/20 px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-xs font-medium text-[#1c1c18]">
            You&apos;ve used all {FREE_DAILY_LIMIT} free Flowy messages today.
          </p>
          <button
            onClick={() => setShowUpgrade(true)}
            className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-white bg-[#39AB54] px-3 py-1.5 rounded-full hover:bg-[#2A8040] transition-colors"
          >
            <PiSparkle /> Upgrade
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 bg-gray-50/50 border-t border-gray-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={isAtLimit ? "Upgrade for unlimited messages..." : "Ask a question..."}
            disabled={isAtLimit}
            className="flex-1 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm text-[#0D2419] focus:outline-none focus:ring-2 focus:ring-[#39AB54] transition-all placeholder:text-[#0D2419]/40 disabled:opacity-40 disabled:cursor-not-allowed shadow-inner"
          />
          <button
            onClick={isAtLimit ? () => setShowUpgrade(true) : handleSend}
            disabled={(!input.trim() && !isAtLimit) || loading}
            className="h-10 w-10 shrink-0 rounded-full bg-[#39AB54] text-white flex items-center justify-center shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-[#39AB54]/50"
          >
            {isAtLimit ? <PiSparkle /> : <PiPaperPlaneRightBold />}
          </button>
        </div>
      </div>

      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        reason={`You've used all ${FREE_DAILY_LIMIT} free Flowy messages today.`}
      />
    </div>
  );
}
