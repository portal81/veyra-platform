"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Layers,
  ArrowUp,
  ArrowDown,
  Trash2,
  Eye,
  EyeOff,
  Save,
  Globe,
  Settings,
  Cpu,
  Laptop,
  Tablet,
  Smartphone,
  Plus,
  RefreshCw,
} from "lucide-react";

type BuilderSection = {
  id: string;
  type: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  visible: boolean;
};

export default function VeyraVisualStudio() {
  const [sections, setSections] = useState<BuilderSection[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"library" | "outline">("outline");
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Global settings states
  const [companyName, setCompanyName] = useState("");
  const [hazemEnabled, setHazemEnabled] = useState(true);
  const [hazemPrompt, setHazemPrompt] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [gtmId, setGtmId] = useState("");

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const getWebsiteUrl = () => {
    if (typeof window === "undefined") return "https://veyra-platform.vercel.app";
    const host = window.location.hostname;
    if (host.includes("localhost") || host.includes("127.0.0.1")) {
      return "http://localhost:3000";
    }
    return "https://veyra-platform.vercel.app";
  };

  const websiteUrl = getWebsiteUrl();

  // Load settings from DB
  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      const data = await res.json();
      
      const content = data.content || {};
      const draftSecs = content.draftSections || content.builderSections || [];
      
      setSections(draftSecs);
      setCompanyName(data.companyName || "");
      setHazemEnabled(data.hazemAi?.enabled ?? true);
      setHazemPrompt(data.hazemAi?.systemPrompts?.website || "");
      
      // SEO & Tracking
      setMetaTitle(content.metaTitle || "");
      setMetaDescription(content.metaDescription || "");
      setGtmId(content.gtmId || "");
    } catch (err: any) {
      toast.error("حدث خطأ أثناء تحميل الإعدادات: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();

    // Listen to messages from the website iframe
    const handleIframeMessage = async (event: MessageEvent) => {
      const trustedOrigin = new URL(websiteUrl).origin;
      if (event.origin !== trustedOrigin && !event.origin.includes("localhost")) {
        return;
      }

      const { type, secId, field, value, sections: newSections } = event.data || {};

      if (type === "SELECT_SECTION") {
        setSelectedSectionId(secId);
      }

      if (type === "UPDATE_TEXT") {
        setSections((prev) => {
          const next = prev.map((s) => (s.id === secId ? { ...s, [field]: value } : s));
          saveDraft(next);
          return next;
        });
      }

      if (type === "REORDER_SECTIONS" && newSections) {
        setSections(newSections);
        saveDraft(newSections);
      }

      if (type === "MOVE_SECTION") {
        setSections((prev) => {
          const idx = prev.findIndex((s) => s.id === secId);
          if (idx === -1) return prev;
          const targetIdx = value === "up" ? idx - 1 : idx + 1;
          if (targetIdx < 0 || targetIdx >= prev.length) return prev;

          const list = [...prev];
          const [moved] = list.splice(idx, 1);
          list.splice(targetIdx, 0, moved);
          
          saveDraft(list);
          syncIframe(list);
          return list;
        });
      }

      if (type === "DELETE_SECTION") {
        setSections((prev) => {
          const list = prev.filter((s) => s.id !== secId);
          saveDraft(list);
          syncIframe(list);
          return list;
        });
      }
    };

    window.addEventListener("message", handleIframeMessage);
    return () => {
      window.removeEventListener("message", handleIframeMessage);
    };
  }, [websiteUrl]);

  // Sync state to iframe
  const syncIframe = (list: BuilderSection[]) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: "SYNC_SECTIONS", data: { sections: list } },
        "*"
      );
    }
  };

  // Save draft layout to database
  const saveDraft = async (updatedSections: BuilderSection[]) => {
    try {
      setSaving(true);
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error("Failed to load settings record");
      const current = await res.json();

      const updated = {
        ...current,
        content: {
          ...current.content,
          draftSections: updatedSections,
        },
      };

      const saveRes = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (!saveRes.ok) throw new Error("Failed to save draft settings");
    } catch (err: any) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Publish draft changes to live website
  const handlePublish = async () => {
    try {
      setPublishing(true);
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error("Failed to load settings record");
      const current = await res.json();

      const updated = {
        ...current,
        companyName,
        hazemAi: {
          ...current.hazemAi,
          enabled: hazemEnabled,
          systemPrompts: {
            ...current.hazemAi?.systemPrompts,
            website: hazemPrompt,
          },
        },
        content: {
          ...current.content,
          builderSections: sections, // Copy draft to live builderSections
          metaTitle,
          metaDescription,
          gtmId,
        },
      };

      const saveRes = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (!saveRes.ok) throw new Error("Failed to publish settings");
      toast.success("تم نشر التعديلات بنجاح إلى الموقع العام لايف!");
      
      // Reload iframe to reflect published state
      if (iframeRef.current) {
        iframeRef.current.src = iframeRef.current.src;
      }
    } catch (err: any) {
      toast.error("حدث خطأ أثناء النشر: " + err.message);
    } finally {
      setPublishing(false);
    }
  };

  // Handle HTML5 Drag and Drop for Section List in left sidebar
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (sourceIndex === targetIndex) return;

    const list = [...sections];
    const [moved] = list.splice(sourceIndex, 1);
    list.splice(targetIndex, 0, moved);

    setSections(list);
    saveDraft(list);
    syncIframe(list);
  };

  const selectedSection = sections.find((s) => s.id === selectedSectionId);

  return (
    <div className="flex h-[calc(100vh-64px)] w-full flex-col bg-[#16110a] text-[#f7f1e7] font-sans antialiased">
      {/* Top Header */}
      <header className="flex h-16 items-center justify-between border-b border-[rgba(212,164,79,0.15)] bg-[#1e170f] px-6">
        <div className="flex items-center gap-3">
          <Layers className="h-6 w-6 text-brand-gold" />
          <h1 className="text-lg font-bold tracking-wide">Veyra Visual Studio | استوديو التصميم المرئي</h1>
          {saving && <span className="text-xs text-[rgba(212,164,79,0.6)] animate-pulse">يتم حفظ المسودة تلقائياً...</span>}
        </div>

        {/* Viewport Selectors */}
        <div className="flex items-center gap-2 rounded-lg bg-[#16110a] p-1 border border-[rgba(212,164,79,0.1)]">
          <button
            onClick={() => setViewport("desktop")}
            className={`p-2 rounded-md transition-all ${viewport === "desktop" ? "bg-brand-gold text-[#16110a]" : "text-[rgba(247,241,231,0.6)] hover:text-[#f7f1e7]"}`}
          >
            <Laptop className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewport("tablet")}
            className={`p-2 rounded-md transition-all ${viewport === "tablet" ? "bg-brand-gold text-[#16110a]" : "text-[rgba(247,241,231,0.6)] hover:text-[#f7f1e7]"}`}
          >
            <Tablet className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewport("mobile")}
            className={`p-2 rounded-md transition-all ${viewport === "mobile" ? "bg-brand-gold text-[#16110a]" : "text-[rgba(247,241,231,0.6)] hover:text-[#f7f1e7]"}`}
          >
            <Smartphone className="h-4 w-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={loadSettings}
            className="flex items-center gap-2 rounded-lg border border-[rgba(212,164,79,0.2)] px-4 py-2 text-sm text-[rgba(247,241,231,0.8)] hover:bg-[rgba(212,164,79,0.1)]"
          >
            <RefreshCw className="h-4 w-4" />
            تحديث
          </button>
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-gold to-brand-gold-dark px-5 py-2 text-sm font-bold text-[#16110a] shadow-lg shadow-[rgba(212,164,79,0.15)] hover:opacity-90 disabled:opacity-50"
          >
            <Globe className="h-4 w-4" />
            {publishing ? "جاري النشر لايف..." : "نشر التعديلات لايف"}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Library & Tree */}
        <aside className="w-80 border-r border-[rgba(212,164,79,0.15)] bg-[#1e170f] flex flex-col">
          <div className="flex border-b border-[rgba(212,164,79,0.1)]">
            <button
              onClick={() => setActiveTab("outline")}
              className={`flex-1 py-3 text-center text-sm font-medium transition-all border-b-2 ${activeTab === "outline" ? "border-brand-gold text-brand-gold" : "border-transparent text-[rgba(247,241,231,0.6)]"}`}
            >
              الهيكل الشجري للأقسام
            </button>
            <button
              onClick={() => setActiveTab("library")}
              className={`flex-1 py-3 text-center text-sm font-medium transition-all border-b-2 ${activeTab === "library" ? "border-brand-gold text-brand-gold" : "border-transparent text-[rgba(247,241,231,0.6)]"}`}
            >
              مكتبة البلوكات
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === "outline" ? (
              <div className="space-y-2">
                <p className="text-xs text-[rgba(247,241,231,0.5)] mb-3">يمكنك سحب وإفلات العناصر لترتيبها داخل الكانفاس</p>
                {sections.map((section, index) => (
                  <div
                    key={section.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    onClick={() => {
                      setSelectedSectionId(section.id);
                      if (iframeRef.current?.contentWindow) {
                        iframeRef.current.contentWindow.postMessage(
                          { type: "SELECT_SECTION_IN_IFRAME", data: { secId: section.id } },
                          "*"
                        );
                      }
                    }}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-grab transition-all ${
                      selectedSectionId === section.id
                        ? "bg-[rgba(212,164,79,0.1)] border-brand-gold shadow-md"
                        : "bg-[#16110a] border-[rgba(212,164,79,0.1)] hover:border-[rgba(212,164,79,0.3)]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-brand-gold">0{index + 1}</span>
                      <div>
                        <p className="text-sm font-semibold">{section.titleAr || section.type}</p>
                        <p className="text-[10px] text-[rgba(247,241,231,0.4)] capitalize">{section.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSections((prev) => {
                            const next = prev.map((s) => (s.id === section.id ? { ...s, visible: !s.visible } : s));
                            saveDraft(next);
                            syncIframe(next);
                            return next;
                          });
                        }}
                        className="p-1 hover:bg-[rgba(212,164,79,0.2)] rounded text-[rgba(247,241,231,0.6)]"
                      >
                        {section.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5 text-red-400" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { type: "hero", label: "البطل / Hero" },
                  { type: "services", label: "الخدمات الثلاثة" },
                  { type: "projects", label: "معرض الوحدات" },
                  { type: "estimator", label: "حاسبة الأسعار" },
                  { type: "smart-home", label: "الأتمتة والتشطيب" },
                  { type: "booking", label: "طلب المعاينة" },
                ].map((block) => (
                  <button
                    key={block.type}
                    onClick={() => {
                      const newSec: BuilderSection = {
                        id: `sec-${block.type}-${Date.now().toString().slice(-4)}`,
                        type: block.type,
                        titleAr: block.label,
                        titleEn: block.label + " Block",
                        subtitleAr: "اكتب وصفاً فرعياً مناسباً هنا للظهور بالبيلدر.",
                        subtitleEn: "Write a matching sub-description for this block.",
                        visible: true,
                      };
                      const updated = [...sections, newSec];
                      setSections(updated);
                      saveDraft(updated);
                      syncIframe(updated);
                      setSelectedSectionId(newSec.id);
                      toast.success(`تمت إضافة بلوك ${block.label}`);
                    }}
                    className="flex flex-col items-center justify-center p-4 rounded-xl border border-[rgba(212,164,79,0.15)] bg-[#16110a] hover:border-brand-gold transition-all group"
                  >
                    <Plus className="h-5 w-5 text-brand-gold group-hover:scale-125 transition-transform mb-2" />
                    <span className="text-xs font-medium text-center">{block.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Center Workspace: Live Canvas with dynamic Viewport wrap */}
        <main className="flex-1 bg-[#110d08] flex items-center justify-center p-4 overflow-hidden relative">
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="h-8 w-8 text-brand-gold animate-spin" />
              <p className="text-sm text-[rgba(247,241,231,0.6)]">جاري تحميل استوديو البناء المرئي...</p>
            </div>
          ) : (
            <div
              className="h-full w-full transition-all duration-300 rounded-xl overflow-hidden border border-[rgba(212,164,79,0.2)] bg-white shadow-2xl"
              style={{
                maxWidth: viewport === "mobile" ? "420px" : viewport === "tablet" ? "768px" : "100%",
              }}
            >
              <iframe
                ref={iframeRef}
                src={`${websiteUrl}/?preview=true`}
                className="w-full h-full border-none"
                title="Veyra Visual Studio Canvas"
              />
            </div>
          )}
        </main>

        {/* Right Sidebar: Properties & Configs */}
        <aside className="w-80 border-l border-[rgba(212,164,79,0.15)] bg-[#1e170f] flex flex-col overflow-y-auto p-4 space-y-6">
          {selectedSection ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[rgba(212,164,79,0.1)] pb-3">
                <h3 className="text-sm font-bold text-brand-gold">تعديل خصائص البلوك النشط</h3>
                <button
                  onClick={() => setSelectedSectionId(null)}
                  className="text-xs text-[rgba(247,241,231,0.5)] hover:text-[#f7f1e7]"
                >
                  إلغاء التحديد
                </button>
              </div>

              {/* Title & Subtitle Inputs */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[rgba(247,241,231,0.6)] block mb-1">العنوان (العربية)</label>
                  <input
                    type="text"
                    value={selectedSection.titleAr}
                    onChange={(e) => {
                      const next = sections.map((s) => (s.id === selectedSectionId ? { ...s, titleAr: e.target.value } : s));
                      setSections(next);
                      saveDraft(next);
                      syncIframe(next);
                    }}
                    className="w-full bg-[#16110a] border border-[rgba(212,164,79,0.2)] rounded px-3 py-2 text-sm focus:border-brand-gold outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-[rgba(247,241,231,0.6)] block mb-1">العنوان (الإنجليزية)</label>
                  <input
                    type="text"
                    value={selectedSection.titleEn}
                    onChange={(e) => {
                      const next = sections.map((s) => (s.id === selectedSectionId ? { ...s, titleEn: e.target.value } : s));
                      setSections(next);
                      saveDraft(next);
                      syncIframe(next);
                    }}
                    className="w-full bg-[#16110a] border border-[rgba(212,164,79,0.2)] rounded px-3 py-2 text-sm focus:border-brand-gold outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-[rgba(247,241,231,0.6)] block mb-1">الوصف الفرعي (العربية)</label>
                  <textarea
                    rows={3}
                    value={selectedSection.subtitleAr}
                    onChange={(e) => {
                      const next = sections.map((s) => (s.id === selectedSectionId ? { ...s, subtitleAr: e.target.value } : s));
                      setSections(next);
                      saveDraft(next);
                      syncIframe(next);
                    }}
                    className="w-full bg-[#16110a] border border-[rgba(212,164,79,0.2)] rounded px-3 py-2 text-sm focus:border-brand-gold outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-[rgba(247,241,231,0.6)] block mb-1">الوصف الفرعي (الإنجليزية)</label>
                  <textarea
                    rows={3}
                    value={selectedSection.subtitleEn}
                    onChange={(e) => {
                      const next = sections.map((s) => (s.id === selectedSectionId ? { ...s, subtitleEn: e.target.value } : s));
                      setSections(next);
                      saveDraft(next);
                      syncIframe(next);
                    }}
                    className="w-full bg-[#16110a] border border-[rgba(212,164,79,0.2)] rounded px-3 py-2 text-sm focus:border-brand-gold outline-none resize-none"
                  />
                </div>
              </div>

              {/* Action Buttons inside inspector */}
              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => {
                    setSections((prev) => {
                      const list = prev.filter((s) => s.id !== selectedSectionId);
                      saveDraft(list);
                      syncIframe(list);
                      return list;
                    });
                    setSelectedSectionId(null);
                    toast.error("تم حذف القسم");
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-950/40 border border-red-800 text-red-200 py-2 rounded text-xs hover:bg-red-950/60"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  حذف البلوك
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="border-b border-[rgba(212,164,79,0.1)] pb-3">
                <h3 className="text-sm font-bold text-brand-gold">الإعدادات العامة للموقع والـ SEO</h3>
              </div>

              {/* Company Identity & Hazem Config */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-[rgba(247,241,231,0.6)] block mb-1">اسم الشركة العقارية</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-[#16110a] border border-[rgba(212,164,79,0.2)] rounded px-3 py-2 text-sm focus:border-brand-gold outline-none"
                  />
                </div>

                <div className="border-t border-[rgba(212,164,79,0.1)] pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">تفعيل مساعد حازم AI</span>
                    <input
                      type="checkbox"
                      checked={hazemEnabled}
                      onChange={(e) => setHazemEnabled(e.target.checked)}
                      className="accent-brand-gold"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[rgba(247,241,231,0.6)] block mb-1">الـ Prompt العام لحازم</label>
                    <textarea
                      rows={4}
                      value={hazemPrompt}
                      onChange={(e) => setHazemPrompt(e.target.value)}
                      className="w-full bg-[#16110a] border border-[rgba(212,164,79,0.2)] rounded px-3 py-2 text-sm focus:border-brand-gold outline-none resize-none"
                    />
                  </div>
                </div>

                {/* SEO Config */}
                <div className="border-t border-[rgba(212,164,79,0.1)] pt-4 space-y-3">
                  <div>
                    <label className="text-xs text-[rgba(247,241,231,0.6)] block mb-1">العنوان لمحركات البحث (Meta Title)</label>
                    <input
                      type="text"
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      className="w-full bg-[#16110a] border border-[rgba(212,164,79,0.2)] rounded px-3 py-2 text-sm focus:border-brand-gold outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[rgba(247,241,231,0.6)] block mb-1">الوصف العام (Meta Description)</label>
                    <textarea
                      rows={3}
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      className="w-full bg-[#16110a] border border-[rgba(212,164,79,0.2)] rounded px-3 py-2 text-sm focus:border-brand-gold outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[rgba(247,241,231,0.6)] block mb-1">كود التتبع Google Tag Manager</label>
                    <input
                      type="text"
                      placeholder="GTM-XXXXXX"
                      value={gtmId}
                      onChange={(e) => setGtmId(e.target.value)}
                      className="w-full bg-[#16110a] border border-[rgba(212,164,79,0.2)] rounded px-3 py-2 text-sm focus:border-brand-gold outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
