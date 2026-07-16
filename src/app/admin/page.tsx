import Link from "next/link";
import { redirect } from "next/navigation";
import { SaaSPageShell } from "@/components/admin/saas-page-shell";
import { getAdminSession } from "@/lib/admin-auth";
import { hasPermission } from "@/lib/admin-session";
import { getCurrentAdminLocale } from "@/lib/admin-locale-server";
import { pickAdminText, translateDbText } from "@/lib/admin-locale";
import { getCrmSnapshot, getDashboardStats, getLeads, getTeamConnectFeed } from "@/lib/repository";

const closedStages = new Set(["closed_won", "closed_lost"]);
const STALE_DAYS = 3;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const locale = await getCurrentAdminLocale();
  const session = await getAdminSession();
  if (!hasPermission(session, "dashboard.view")) {
    redirect("/auth/login?next=/admin");
  }

  const [stats, snapshot, leads] = await Promise.all([getDashboardStats(), getCrmSnapshot(), getLeads()]);
  const connectFeed = await getTeamConnectFeed();

  const leadTimestamps = leads.map((lead) => new Date(lead.createdAt).getTime()).filter((ts) => Number.isFinite(ts));
  const newestLeadTs = leadTimestamps.length ? Math.max(...leadTimestamps) : 0;

  const staleLeads = leads.filter((lead) => {
    if (closedStages.has(lead.stage)) return false;
    const createdAtTs = new Date(lead.createdAt).getTime();
    if (!Number.isFinite(createdAtTs) || !newestLeadTs) return false;
    return Math.floor((newestLeadTs - createdAtTs) / MS_PER_DAY) >= STALE_DAYS;
  }).length;

  const unassignedLeads = leads.filter((lead) => !lead.assignedTo && !closedStages.has(lead.stage)).length;
  const highPriorityLeads = leads.filter((lead) => lead.priority === "high" && !closedStages.has(lead.stage)).length;
  const latestLeads = leads.slice(0, 5);
  const totalActionItems = highPriorityLeads + unassignedLeads + staleLeads;

  const quickActions = [
    {
      href: "/admin/settings",
      titleEn: "Edit website content",
      titleAr: "عدل محتوى الموقع",
      noteEn: "Open the website editor, shared elements, and page copy from one place.",
      noteAr: "افتح محرر الموقع والعناصر المشتركة ونصوص الصفحات من مكان واحد.",
      eyebrowEn: "Website",
      eyebrowAr: "الموقع",
    },
    {
      href: "/admin/site-map",
      titleEn: "Open website map",
      titleAr: "افتح خريطة الموقع",
      noteEn: "See every page, shared section, and where any edit will appear.",
      noteAr: "شاهد كل صفحة وكل جزء مشترك واعرف أين سيظهر أي تعديل.",
      eyebrowEn: "Visibility",
      eyebrowAr: "الظهور",
    },
    {
      href: "/admin/leads",
      titleEn: "Review leads",
      titleAr: "راجع العملاء",
      noteEn: "Continue follow-up, assignment, quick edits, and next actions.",
      noteAr: "تابع العملاء والتعيين والتعديل السريع والخطوة التالية.",
      eyebrowEn: "Sales",
      eyebrowAr: "المبيعات",
    },
    {
      href: `${process.env.NEXT_PUBLIC_PUBLIC_SITE_URL ?? "https://veyra-platform.vercel.app"}`,
      titleEn: "Open public site",
      titleAr: "افتح الموقع العام",
      noteEn: "Compare what visitors see before publishing or after final changes.",
      noteAr: "قارن ما يراه الزائر قبل النشر أو بعد التعديلات النهائية.",
      eyebrowEn: "Preview",
      eyebrowAr: "المعاينة",
      external: true,
    },
  ];

  const actionCards = [
    {
      titleEn: "High-priority leads",
      titleAr: "عملاء بأولوية قصوى",
      value: highPriorityLeads,
      href: "/admin/leads",
      noteEn: highPriorityLeads > 0 ? "These leads need action now before they cool down." : "No urgent high-priority leads right now.",
      noteAr: highPriorityLeads > 0 ? "العملاء دول يحتاجون تدخلًا الآن قبل ما يبردوا." : "لا يوجد عملاء عاجلون بأولوية قصوى الآن.",
      tone: highPriorityLeads > 0 ? "danger" : "calm",
      ctaEn: "Open lead queue",
      ctaAr: "افتح قائمة العملاء",
    },
    {
      titleEn: "Unassigned leads",
      titleAr: "عملاء بدون مسؤول",
      value: unassignedLeads,
      href: "/admin/leads",
      noteEn: unassignedLeads > 0 ? "Assign owners so follow-up does not stall." : "All open leads currently have owners.",
      noteAr: unassignedLeads > 0 ? "عيّن مسؤولًا لكل عميل حتى لا تتعطل المتابعة." : "كل العملاء الحاليين لديهم مسؤول الآن.",
      tone: unassignedLeads > 0 ? "warn" : "calm",
      ctaEn: "Assign team owners",
      ctaAr: "عيّن المسؤولين",
    },
    {
      titleEn: "Stale leads",
      titleAr: "عملاء متأخرون",
      value: staleLeads,
      href: "/admin/leads",
      noteEn: staleLeads > 0 ? "These leads are older than the active SLA window." : "No stale leads inside the active pipeline.",
      noteAr: staleLeads > 0 ? "هؤلاء العملاء تخطوا نافذة المتابعة النشطة." : "لا يوجد عملاء متأخرون داخل خط المتابعة الآن.",
      tone: staleLeads > 0 ? "neutral" : "calm",
      ctaEn: "Resume follow-up",
      ctaAr: "ارجع للمتابعة",
    },
  ];

  const statLabelMap: Record<string, string> = {
    Projects: "المشروعات",
    Services: "الخدمات",
    "Open Leads": "عملاء حاليون",
    "Response SLA": "زمن الاستجابة",
  };

  return (
    <SaaSPageShell
      title={pickAdminText(locale, "Workspace overview", "نظرة عامة على مساحة العمل")}
      description={pickAdminText(
        locale,
        "Start from the task you need now, then use the numbers below as operational context.",
        "ابدأ بالمهمة التي تريدها الآن، ثم استخدم الأرقام التالية كمرجع تشغيلي سريع.",
      )}
    >
      <div className="grid gap-6 2xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-6">
          <section className="admin-shell-surface p-6">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/8 pb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-gold">
                  {pickAdminText(locale, "Today workspace", "مساحة عمل اليوم")}
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                  {pickAdminText(locale, "What do you want to move forward now?", "ما الذي تريد تحريكه الآن؟")}
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/62">
                  {pickAdminText(
                    locale,
                    "Open the website, leads, or map directly from here instead of searching through modules.",
                    "افتح الموقع أو العملاء أو خريطة الموقع مباشرة من هنا بدل التنقل بين الموديولات.",
                  )}
                </p>
              </div>
              <div className="admin-shell-muted-card px-4 py-3 text-sm text-[#f6d293]">
                <span className="block text-[11px] uppercase tracking-[0.22em] text-brand-gold/72">
                  {pickAdminText(locale, "Action count", "عدد التدخلات")}
                </span>
                <strong className="mt-2 block text-2xl font-semibold text-white">{totalActionItems}</strong>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
              {quickActions.map((card) => (
                <Link
                  key={card.titleEn}
                  href={card.href}
                  target={card.external ? "_blank" : undefined}
                  className="admin-shell-card p-5"
                >
                  <p className="text-[11px] uppercase tracking-[0.22em] text-brand-gold">
                    {pickAdminText(locale, card.eyebrowEn, card.eyebrowAr)}
                  </p>
                  <h3 className="mt-3 text-lg font-semibold text-white">
                    {pickAdminText(locale, card.titleEn, card.titleAr)}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-white/58">
                    {pickAdminText(locale, card.noteEn, card.noteAr)}
                  </p>
                </Link>
              ))}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {actionCards.map((card) => {
              const toneClass =
                card.tone === "danger"
                  ? "border-red-400/25 bg-red-500/[0.06]"
                  : card.tone === "warn"
                    ? "border-amber-400/25 bg-amber-500/[0.06]"
                    : card.tone === "neutral"
                      ? "border-white/10 bg-white/[0.04]"
                      : "border-emerald-400/20 bg-emerald-500/[0.05]";

              return (
                <Link key={card.titleEn} href={card.href} className={`rounded-[26px] border p-5 transition hover:border-brand-gold/35 ${toneClass}`}>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-white/42">
                    {pickAdminText(locale, "Needs action", "يحتاج حركة")}
                  </p>
                  <div className="mt-4 flex items-end justify-between gap-4">
                    <div>
                      <strong className="block text-4xl font-semibold tracking-tight text-white">{card.value}</strong>
                      <h3 className="mt-3 text-base font-semibold text-white">
                        {pickAdminText(locale, card.titleEn, card.titleAr)}
                      </h3>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-white/58">
                    {pickAdminText(locale, card.noteEn, card.noteAr)}
                  </p>
                  <span className="admin-shell-button-ghost mt-4 inline-flex px-3 py-1.5 text-[11px] font-semibold text-brand-gold">
                    {pickAdminText(locale, card.ctaEn, card.ctaAr)}
                  </span>
                </Link>
              );
            })}
          </section>

          <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="admin-shell-card p-5">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/42">
                  {pickAdminText(locale, stat.label, statLabelMap[stat.label] || stat.label)}
                </p>
                <strong className="mt-3 block text-3xl font-semibold tabular-nums tracking-tight text-white">{stat.value}</strong>
              </div>
            ))}
          </section>

          <section className="admin-shell-panel overflow-hidden">
            <div className="border-b border-white/8 px-5 py-4">
              <h2 className="text-base font-semibold text-white">
                {pickAdminText(locale, "Sales pipeline health", "صحة خط المبيعات")}
              </h2>
            </div>
            <div className="grid grid-cols-2 divide-x divide-y divide-white/8 md:grid-cols-4 md:divide-y-0">
              <MetricCard label={pickAdminText(locale, "Total pipeline", "إجمالي العملاء")} value={snapshot.totalLeads} />
              <MetricCard label={pickAdminText(locale, "Pending invites", "دعوات معلقة")} value={snapshot.pendingInvites} />
              <MetricCard label={pickAdminText(locale, "Active team", "الفريق النشط")} value={snapshot.activeUsers} />
              <MetricCard label={pickAdminText(locale, "Scheduled visits", "زيارات مجدولة")} value={snapshot.stageCounts.site_visit || 0} />
            </div>
          </section>
        </div>

        <div className="grid gap-6">
          <section className="admin-shell-panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-brand-gold">
                  {pickAdminText(locale, "Latest movement", "آخر حركة")}
                </p>
                <h2 className="mt-2 text-base font-semibold text-white">
                  {pickAdminText(locale, "Fresh leads", "طلبات حديثة")}
                </h2>
              </div>
              <Link href="/admin/leads" className="text-xs text-brand-gold hover:underline">
                {pickAdminText(locale, "View all", "عرض الكل")}
              </Link>
            </div>
            <div className="divide-y divide-white/8">
              {latestLeads.length > 0 ? (
                latestLeads.map((lead) => (
                  <Link key={lead.id} href="/admin/leads" className="group block p-4 transition hover:bg-white/[0.04]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <strong className="block text-sm font-semibold text-white transition group-hover:text-brand-gold">{lead.fullName}</strong>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/48">
                          <span className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 font-medium text-white/70">
                            {translateDbText(locale, lead.service)}
                          </span>
                          <span>{translateDbText(locale, lead.priority)}</span>
                        </div>
                      </div>
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${lead.priority === "high" ? "border-red-400/25 bg-red-500/10 text-red-200" : "border-white/10 bg-white/[0.04] text-white/52"}`}>
                        {translateDbText(locale, lead.priority)}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-8 text-center text-sm text-white/48">
                  {pickAdminText(locale, "No recent entries found.", "لا توجد إضافات حديثة.")}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[26px] border border-white/10 bg-black/20 p-5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-brand-gold">
              {pickAdminText(locale, "Quick reading", "قراءة سريعة")}
            </p>
            <div className="mt-4 grid gap-4">
              <ReadingRow
                label={pickAdminText(locale, "High priority leads", "العملاء ذوو الأولوية")}
                value={highPriorityLeads}
                tone={highPriorityLeads > 0 ? "danger" : "calm"}
              />
              <ReadingRow
                label={pickAdminText(locale, "Unassigned leads", "العملاء غير المسندين")}
                value={unassignedLeads}
                tone={unassignedLeads > 0 ? "warn" : "calm"}
              />
              <ReadingRow
                label={pickAdminText(locale, "Stale follow-up", "المتابعة المتأخرة")}
                value={staleLeads}
                tone={staleLeads > 0 ? "neutral" : "calm"}
              />
            </div>
          </section>
        </div>

        {/* ── Veyra Connect Feed ── */}
        {connectFeed.length > 0 ? (
          <section className="admin-shell-panel mt-6 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-brand-gold">
                  {pickAdminText(locale, "Veyra Connect", "تواصل الفريق")}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-white">
                  {pickAdminText(locale, "Latest team activity", "آخر نشاط الفريق")}
                </h2>
              </div>
            </div>
            <div className="mt-4 grid gap-2">
              {connectFeed.slice(0, 5).map((item) => (
                <div key={item.id} className="admin-shell-muted-card flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                      item.kind === "discussion" ? "text-sky-400" : "text-amber-400"
                    }`}>
                      {item.kind === "discussion"
                        ? pickAdminText(locale, "discussion", "نقاش")
                        : item.kind === "handoff_accepted"
                          ? pickAdminText(locale, "handoff", "تسليم")
                          : pickAdminText(locale, "handoff", "تسليم")}
                    </span>
                    <span className="text-sm text-white/70 truncate">{item.body}</span>
                  </div>
                  <span className="shrink-0 text-[10px] text-white/35">{item.createdBy}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </SaaSPageShell>
  );
}

function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="p-5">
      <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-white/42">{label}</p>
      <strong className="text-2xl font-bold tracking-tight text-white">{value}</strong>
    </div>
  );
}

function ReadingRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "danger" | "warn" | "neutral" | "calm";
}) {
  const dotClass =
    tone === "danger"
      ? "bg-red-500"
      : tone === "warn"
        ? "bg-amber-500"
        : tone === "neutral"
          ? "bg-white/35"
          : "bg-emerald-400";

  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
      <div className="flex items-center gap-3">
        <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
        <span className="text-sm text-white/72">{label}</span>
      </div>
      <strong className="text-lg font-semibold tabular-nums text-white">{value}</strong>
    </div>
  );
}
