"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function AiConcierge() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "أهلًا بيك في Veyra. أنا حازم، المستشار الرقمي. أسألني عن أي مشروع، تشطيب، أو منزل ذكي.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    const userMessage: Message = { role: "user", content: text };
    const updated = [...messages, userMessage];
    setMessages(updated);
    setLoading(true);

    try {
      const res = await fetch("/api/hazem/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: updated.slice(0, -1),
        }),
      });
      const data = (await res.json()) as { reply?: string; message?: string };
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply ?? data.message ?? "عذرًا، حاول تاني." }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "عذرًا، حصل خطأ في الاتصال. حاول تاني." }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      <button
        onClick={() => setOpen((prev) => !prev)}
        className="group fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#f2c16b] to-[#c68f43] shadow-2xl shadow-[#c68f43]/30 transition-all hover:scale-105 active:scale-95"
        aria-label={open ? "Close concierge" : "Open AI concierge"}
      >
        {open ? (
          <svg className="h-6 w-6 text-[#1f150d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-6 w-6 text-[#1f150d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      <div
        className={`fixed bottom-24 right-6 z-50 w-[360px] origin-bottom-right transition-all duration-300 ${
          open ? "scale-100 opacity-100" : "scale-90 opacity-0 pointer-events-none"
        }`}
      >
        <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#171210]/95 shadow-2xl shadow-black/40 backdrop-blur-2xl">
          <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#f2c16b] to-[#c68f43] text-sm font-bold text-[#1f150d]">
                ح
              </div>
              <div>
                <p className="text-sm font-semibold text-white">حازم</p>
                <p className="text-xs text-white/50">المستشار الرقمي</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-full p-1 text-white/40 hover:text-white/80">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex h-[320px] flex-col gap-3 overflow-y-auto px-4 py-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-[20px] px-4 py-3 text-sm leading-7 ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-[#f2c16b] to-[#c68f43] text-[#1f150d]"
                      : "border border-white/8 bg-white/5 text-white/85"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-[20px] border border-white/8 bg-white/5 px-4 py-3">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#f2c16b]/60" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#f2c16b]/60" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#f2c16b]/60" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-white/8 px-4 py-3">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="اسأل حازم..."
                className="flex-1 rounded-full border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none transition focus:border-[#f2c16b]/40"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#f2c16b] to-[#c68f43] text-[#1f150d] transition hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
