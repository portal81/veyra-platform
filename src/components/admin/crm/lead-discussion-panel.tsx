"use client";

import { useCallback, useEffect, useOptimistic, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminLocale } from "@/components/admin/admin-locale-provider";
import type { LeadActivity, TeamUser } from "@/lib/types";

type Props = {
  leadId: string;
  initialComments: LeadActivity[];
  users: TeamUser[];
  currentUserId: string;
};

export function LeadDiscussionPanel({ leadId, initialComments, users, currentUserId }: Props) {
  const { locale } = useAdminLocale();
  const router = useRouter();
  const [comments, setComments] = useState<LeadActivity[]>(initialComments);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const listEndRef = useRef<HTMLDivElement>(null);

  const userMap = new Map(users.map((u) => [u.id, u]));
  const currentUser = userMap.get(currentUserId);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments.length]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!body.trim() || sending) return;

      setSending(true);
      const mentionIds: string[] = [];
      const processed = body.replace(/@(\w+)/g, (_match, name) => {
        const user = users.find(
          (u) => u.fullName.toLowerCase().includes(name.toLowerCase()) || u.email.startsWith(name),
        );
        if (user) {
          mentionIds.push(user.id);
          return `@${user.fullName}`;
        }
        return _match;
      });

      try {
        const res = await fetch("/api/admin/leads/discuss", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId, body: processed, createdBy: currentUserId, mentions: mentionIds }),
        });
        if (!res.ok) throw new Error("Failed");
        const { activity } = await res.json();
        setComments((prev) => [...prev, activity]);
        setBody("");
      } catch {
        const optimistic: LeadActivity = {
          id: `opt-${Date.now()}`,
          leadId,
          kind: "discussion",
          body: processed,
          createdAt: new Date().toISOString(),
          createdBy: currentUserId,
          mentions: mentionIds,
        };
        setComments((prev) => [...prev, optimistic]);
        setBody("");
      } finally {
        setSending(false);
      }
    },
    [body, sending, leadId, currentUserId, users],
  );

  return (
    <div className="admin-shell-panel scroll-mt-6 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#f2c16b]">
            {locale === "ar" ? "نقاش الفريق" : "Team Discussion"}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            {locale === "ar" ? "تواصل داخلي" : "Veyra Connect"}
          </h2>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/50">
          {comments.length} {locale === "ar" ? "رسالة" : "messages"}
        </span>
      </div>

      <div className="mt-4 grid max-h-[400px] gap-3 overflow-y-auto pr-1">
        {comments.length > 0 ? (
          comments.map((comment) => {
            const author = userMap.get(comment.createdBy)?.fullName ?? comment.createdBy;
            const isCurrentUser = comment.createdBy === currentUserId;
            return (
              <div
                key={comment.id}
                className={`rounded-2xl border px-4 py-3 ${
                  isCurrentUser
                    ? "border-[#f2c16b]/20 bg-[#f2c16b]/5 ml-8"
                    : "border-white/8 bg-white/[3%] mr-8"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-white/70">{author}</span>
                  <span className="text-[10px] text-white/35">
                    {new Date(comment.createdAt).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="mt-1.5 text-sm leading-6 text-white/80">{comment.body}</p>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-center text-sm text-white/55">
            {locale === "ar"
              ? "لا توجد رسائل بعد. ابدأ النقاش مع الفريق."
              : "No messages yet. Start the discussion with your team."}
          </div>
        )}
        <div ref={listEndRef} />
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={
            locale === "ar"
              ? "اكتب رسالة... استخدم @لذكر عضو"
              : "Type a message... use @ to mention"
          }
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none placeholder:text-neutral-500"
        />
        <button
          type="submit"
          disabled={!body.trim() || sending}
          className="shrink-0 rounded-xl bg-[#f2c16b] px-4 py-2.5 text-sm font-bold text-[#1f150d] transition hover:bg-[#e0b05a] disabled:opacity-40"
        >
          {sending
            ? locale === "ar" ? "..." : "..."
            : locale === "ar" ? "إرسال" : "Send"}
        </button>
      </form>
    </div>
  );
}
