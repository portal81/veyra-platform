"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supa";
import { useAdminLocale } from "@/components/admin/admin-locale-provider";

export default function EngineeringPage() {
  const { direction } = useAdminLocale();
  const [activeTab, setActiveTab] = useState("blueprints");
  const [projects, setProjects] = useState<any[]>([]);
  const [blueprints, setBlueprints] = useState<any[]>([]);
  const [subcontracts, setSubcontracts] = useState<any[]>([]);
  const [moustaklas, setMoustaklas] = useState<any[]>([]);
  const [siteLogs, setSiteLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedProject, setSelectedProject] = useState("");
  const [blueprintTitle, setBlueprintTitle] = useState("");
  const [blueprintUrl, setBlueprintUrl] = useState("");
  
  // Moustaklas calculator state
  const [selectedSubcontract, setSelectedSubcontract] = useState("");
  const [claimedPercent, setClaimedPercent] = useState(0);
  const [approvedPercent, setApprovedPercent] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) return;

      // Fetch projects
      const { data: projData } = await supabase.from("projects").select("*");
      setProjects(projData || []);
      if (projData?.length) setSelectedProject(projData[0].id);

      // Fetch blueprints
      const { data: bpData } = await supabase.from("blueprints").select("*, projects(name)");
      setBlueprints(bpData || []);

      // Fetch subcontractor contracts
      const { data: subData } = await supabase.from("subcontractor_contracts").select("*, projects(name)");
      setSubcontracts(subData || []);
      if (subData?.length) setSelectedSubcontract(subData[0].id);

      // Fetch moustaklas (progress invoices)
      const { data: msData } = await supabase.from("progress_invoices_moustaklas").select("*, subcontractor_contracts(subcontractor_name, total_contract_value)");
      setMoustaklas(msData || []);

      // Fetch daily site logs
      const { data: logData } = await supabase.from("daily_site_logs").select("*, projects(name)");
      setSiteLogs(logData || []);

    } catch (err) {
      console.error("Error fetching engineering data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBlueprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blueprintTitle || !blueprintUrl) return;

    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) return;

      const { error } = await supabase.from("blueprints").insert({
        project_id: selectedProject,
        title: blueprintTitle,
        file_url: blueprintUrl,
        status: "Pending_Review",
        markup_data: {}
      });

      if (error) throw error;
      alert("تمت إضافة المخطط الهندسي بنجاح!");
      setBlueprintTitle("");
      setBlueprintUrl("");
      fetchData();
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
    }
  };

  const handleCreateMoustaklas = async (e: React.FormEvent) => {
    e.preventDefault();
    const contract = subcontracts.find(s => s.id === selectedSubcontract);
    if (!contract) return;

    const payout = (Number(contract.total_contract_value) * approvedPercent) / 100;

    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) return;

      const { error } = await supabase.from("progress_invoices_moustaklas").insert({
        subcontractor_contract_id: selectedSubcontract,
        claimed_percentage: claimedPercent,
        approved_percentage: approvedPercent,
        payout_amount: payout,
        status: "Pending_Approval"
      });

      if (error) throw error;
      alert("تم تقديم طلب المستخلص المالي بنجاح!");
      setClaimedPercent(0);
      setApprovedPercent(0);
      fetchData();
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
    }
  };

  const updateBlueprintStatus = async (id: string, newStatus: string) => {
    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) return;

      const { error } = await supabase
        .from("blueprints")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;
      toastStatusChange(newStatus);
      fetchData();
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
    }
  };

  const toastStatusChange = (status: string) => {
    alert(`تم تحديث حالة المخطط بنجاح إلى: ${status}`);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 font-sans text-slate-800" dir={direction}>
      {/* Title */}
      <div className="mb-8 border-b border-slate-100 pb-5">
        <span className="text-[#B89D74] text-xs uppercase tracking-widest font-semibold">ERP الإدارة الهندسية</span>
        <h1 className="text-3xl font-bold text-[#1A202C] mt-1 font-serif">المخططات والعمليات الإنشائية</h1>
        <p className="text-xs text-slate-500 mt-2">مراجعة مخططات CAD، مستخلصات المقاولين، ومتابعة التقارير الميدانية.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 mb-6">
        {[
          { id: "blueprints", name: "مخططات CAD ومراجعة الرسومات" },
          { id: "moustaklas", name: "مستخلصات المقاولين" },
          { id: "gantt", name: "مخطط غانت للمشروع (Gantt)" },
          { id: "sitelogs", name: "تقارير الموقع اليومية" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-[#0F4C3A] text-[#0F4C3A]"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20">جاري تحميل بيانات الإدارة الهندسية...</div>
      ) : (
        <div className="grid gap-6">
          {/* TAB 1: BLUEPRINTS */}
          {activeTab === "blueprints" && (
            <div className="grid md:grid-cols-[1.5fr_0.5fr] gap-6">
              {/* Blueprints view */}
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
                <h2 className="text-lg font-bold text-[#1A202C]">المخططات المرفوعة للمشروع</h2>
                <div className="grid gap-4">
                  {blueprints.map((bp) => (
                    <div key={bp.id} className="border border-slate-100 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <strong className="block text-[#1A202C]">{bp.title}</strong>
                        <span className="text-xs text-slate-400">المشروع: {bp.projects?.name || "عام"}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                          bp.status === "Approved" ? "bg-emerald-50 text-emerald-600" :
                          bp.status === "Rejected" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                        }`}>
                          {bp.status === "Approved" ? "مقبول" : bp.status === "Rejected" ? "مرفوض" : "قيد المراجعة"}
                        </span>
                        
                        <button
                          onClick={() => updateBlueprintStatus(bp.id, "Approved")}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700"
                        >
                          اعتماد ✅
                        </button>
                        <button
                          onClick={() => updateBlueprintStatus(bp.id, "Rejected")}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700"
                        >
                          رفض ❌
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upload Blueprint form */}
              <form onSubmit={handleCreateBlueprint} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
                <h2 className="text-lg font-bold text-[#1A202C]">رفع مخطط جديد</h2>
                <div>
                  <label className="block text-xs font-semibold text-[#2D3748] mb-1">المشروع المرتبط</label>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2D3748] mb-1">عنوان المخطط *</label>
                  <input
                    type="text"
                    required
                    placeholder="مخطط الطابق الأرضي"
                    value={blueprintTitle}
                    onChange={(e) => setBlueprintTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2D3748] mb-1">رابط ملف المخطط (PDF/CAD) *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://bucket.supabase.co/blueprint.pdf"
                    value={blueprintUrl}
                    onChange={(e) => setBlueprintUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                </div>
                <button type="submit" className="w-full py-2.5 bg-[#0F4C3A] text-white rounded-lg font-bold text-sm">
                  رفع المخطط
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: MOUSTAKLAS */}
          {activeTab === "moustaklas" && (
            <div className="grid md:grid-cols-[1.5fr_0.5fr] gap-6">
              {/* Moustaklas list */}
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
                <h2 className="text-lg font-bold text-[#1A202C]">المستخلصات الإنشائية الحالية</h2>
                <div className="grid gap-4">
                  {moustaklas.map((ms) => (
                    <div key={ms.id} className="border border-slate-100 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <strong className="block text-[#1A202C]">{ms.subcontractor_contracts?.subcontractor_name}</strong>
                        <span className="text-xs text-slate-400">
                          قيمة العقد الإجمالية: {Number(ms.subcontractor_contracts?.total_contract_value).toLocaleString()} جنيه
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-[#0F4C3A]">
                          المبلغ المعتمد: {Number(ms.payout_amount).toLocaleString()} جنيه
                        </div>
                        <span className="text-xs text-slate-400">
                          نسبة الإنجاز: طالب بنسبة {ms.claimed_percentage}% - اعتمد بنسبة {ms.approved_percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calculator Form */}
              <form onSubmit={handleCreateMoustaklas} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
                <h2 className="text-lg font-bold text-[#1A202C]">حاسبة المستخلصات المالي</h2>
                <div>
                  <label className="block text-xs font-semibold text-[#2D3748] mb-1">عقد المقاول المرتبط</label>
                  <select
                    value={selectedSubcontract}
                    onChange={(e) => setSelectedSubcontract(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  >
                    {subcontracts.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.subcontractor_name} ({sub.scope_of_work})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2D3748] mb-1">نسبة الإنجاز المطالب بها (%)</label>
                  <input
                    type="number"
                    max="100"
                    min="0"
                    value={claimedPercent}
                    onChange={(e) => setClaimedPercent(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2D3748] mb-1">نسبة الإنجاز المعتمدة للتحويل (%)</label>
                  <input
                    type="number"
                    max="100"
                    min="0"
                    value={approvedPercent}
                    onChange={(e) => setApprovedPercent(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                </div>
                <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1">
                  <div><strong>مجموع قيمة العقد:</strong> {subcontracts.find(s => s.id === selectedSubcontract)?.total_contract_value?.toLocaleString() || 0} جنيه</div>
                  <div><strong>المبلغ المستحق الدفع:</strong> {((subcontracts.find(s => s.id === selectedSubcontract)?.total_contract_value || 0) * approvedPercent / 100).toLocaleString()} جنيه</div>
                </div>
                <button type="submit" className="w-full py-2.5 bg-[#0F4C3A] text-white rounded-lg font-bold text-sm">
                  تقديم المستخلص
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: GANTT CHART */}
          {activeTab === "gantt" && (
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
              <h2 className="text-lg font-bold text-[#1A202C]">المخطط الزمني للمشاريع الفعالة (Gantt Chart)</h2>
              <div className="border border-slate-100 rounded-xl p-4 overflow-x-auto">
                <div className="min-w-[600px] space-y-4">
                  {/* Timeline header */}
                  <div className="grid grid-cols-[150px_1fr] text-xs font-bold text-slate-400 pb-2 border-b border-slate-50">
                    <div>اسم المشروع</div>
                    <div className="grid grid-cols-4 text-center">
                      <div>الربع الأول</div>
                      <div>الربع الثاني</div>
                      <div>الربع الثالث</div>
                      <div>الربع الرابع</div>
                    </div>
                  </div>
                  
                  {/* Project bars */}
                  {projects.map((p, idx) => (
                    <div key={p.id} className="grid grid-cols-[150px_1fr] items-center">
                      <strong className="text-sm text-[#1A202C]">{p.name}</strong>
                      <div className="relative h-6 bg-slate-50 rounded-full overflow-hidden">
                        <div
                          className={`absolute h-full rounded-full ${
                            idx % 3 === 0 ? "bg-[#0F4C3A]/80" : idx % 3 === 1 ? "bg-[#B89D74]/80" : "bg-sky-700/80"
                          }`}
                          style={{
                            left: idx % 3 === 0 ? "10%" : idx % 3 === 1 ? "30%" : "20%",
                            right: idx % 3 === 0 ? "30%" : idx % 3 === 1 ? "15%" : "40%"
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SITE LOGS */}
          {activeTab === "sitelogs" && (
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
              <h2 className="text-lg font-bold text-[#1A202C]">تقارير الموقع اليومية المزامنة</h2>
              <div className="grid gap-4">
                {siteLogs.map((log) => (
                  <div key={log.id} className="border border-slate-100 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <strong className="text-sm text-[#1A202C]">{log.projects?.name || "مشروع عام"}</strong>
                      <span className="text-xs text-slate-400">{log.log_date}</span>
                    </div>
                    <p className="text-sm text-[#2D3748]">{log.notes || "لا توجد ملاحظات."}</p>
                    <div className="flex justify-between items-center text-xs text-slate-400">
                      <span>عدد العمالة: {log.labor_count} عمال</span>
                      <span className="flex items-center gap-1">
                        {log.is_synced_from_local ? (
                          <span className="text-emerald-600">تمت المزامنة من الميدان 📱</span>
                        ) : (
                          <span className="text-slate-400">مدخل سحابي مباشر ☁️</span>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
