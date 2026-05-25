"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminLocale } from "@/components/admin/admin-locale-provider";
import type { TeamUser } from "@/lib/types";

type Props = {
  leadId: string;
  leadName: string;
  users: TeamUser[];
  currentUserId: string;
  currentAssignee?: string;
  onClose: () => void;
};

export function LeadHandoffDialog({ leadId, leadName, users, currentUserId, currentAssignee, onClose }: Props) {
  const { locale } = useAdminLocale();
  const router = useRouter();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  const availableUsers = users.filter((u) => u.id !== currentUserId);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedUserId || sending) return;
      setSending(true);

      try {
        const res = await fetch("/api/admin/leads/handoff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId, fromUserId: currentUserId, toUserId: selectedUserId, note }),
        });
        if (!res.ok) throw new Error("Failed");
        router.refresh();
        onClose();
      } catch {
        // Optimistic: just close
        router.refresh();
        onClose();
      }
    },
    [selectedUserId, sending, leadId, currentUserId, note, router, onClose],
  );

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="admin-shell-surface w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-white/8 px-5 py-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#f2c16b]">
            {locale === "ar" ? "تسليم عميل" : "Handoff Lead"}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">{leadName}</h2>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 p-5">
          <div className="grid gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-white/50">
              {locale === "ar" ? "تسليم إلى" : "Handoff to"}
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none"
            >
              <option value="">{locale === "ar" ? "اختر عضو فريق..." : "Select team member..."}</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.role})
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-white/50">
              {locale === "ar" ? "ملاحظة التسليم" : "Handoff note"}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder={
                locale === "ar"
                  ? "اكتب ملخص الحالة والمطلوب من المسؤول الجديد..."
                  : "Summarize the case status and what the new assignee needs to do..."
              }
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none placeholder:text-neutral-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="admin-shell-button-ghost rounded-full px-5 py-2.5 text-sm"
            >
              {locale === "ar" ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={!selectedUserId || sending}
              className="admin-shell-button-primary rounded-full px-5 py-2.5 text-sm"
            >
              {sending
                ? locale === "ar" ? "جارٍ..." : "Sending..."
                : locale === "ar" ? "تسليم" : "Handoff"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
