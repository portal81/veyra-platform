import Link from "next/link";
import { pickAdminText } from "@/lib/admin-locale";
import { getCurrentAdminLocale } from "@/lib/admin-locale-server";
import { getLatestInvitationByEmail } from "@/lib/repository";

export const dynamic = "force-dynamic";

type AcceptInviteStatus = "pending" | "accepted" | "missing" | "token_only" | "unknown";

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getCurrentAdminLocale();
  const params = await searchParams;
  const invitedEmail = typeof params.email === "string" ? params.email : "";
  const hasInviteTokens = Boolean(params.token_hash || params.access_token || params.type);
  const invitation = invitedEmail ? await getLatestInvitationByEmail(invitedEmail) : null;

  const inviteStatus: AcceptInviteStatus =
    invitation?.status === "accepted"
      ? "accepted"
      : invitation?.status === "pending"
        ? "pending"
        : invitedEmail
          ? "missing"
          : hasInviteTokens
            ? "token_only"
            : "unknown";

  const loginHref = invitedEmail
    ? `/auth/login?invite=1&email=${encodeURIComponent(invitedEmail)}`
    : "/auth/login?invite=1";

  const statusTone =
    inviteStatus === "accepted"
      ? "border-emerald-500/25 bg-emerald-500/10"
      : inviteStatus === "pending"
        ? "border-amber-500/25 bg-amber-500/10"
        : inviteStatus === "missing"
          ? "border-rose-500/25 bg-rose-500/10"
          : "border-white/10 bg-black/20";

  const statusTitle =
    inviteStatus === "accepted"
      ? pickAdminText(locale, "Invitation already accepted", "تم قبول الدعوة بالفعل")
      : inviteStatus === "pending"
        ? pickAdminText(locale, "Invitation is ready", "الدعوة جاهزة")
        : inviteStatus === "missing"
          ? pickAdminText(locale, "Invitation was not found", "لم يتم العثور على الدعوة")
          : inviteStatus === "token_only"
            ? pickAdminText(locale, "Invitation link detected", "تم اكتشاف رابط دعوة")
            : pickAdminText(locale, "Invitation context is incomplete", "سياق الدعوة غير مكتمل");

  const statusDescription =
    inviteStatus === "accepted"
      ? pickAdminText(
          locale,
          "This email already joined the workspace. Sign in to continue into the correct role workspace.",
          "هذا البريد انضم بالفعل إلى مساحة العمل. سجّل الدخول للمتابعة إلى مساحة الدور الصحيحة.",
        )
      : inviteStatus === "pending"
        ? pickAdminText(
            locale,
            "The invitation is still active. Continue to sign in with the invited email to complete access.",
            "الدعوة ما زالت نشطة. أكمل إلى تسجيل الدخول بالبريد المدعو لإتمام الوصول.",
          )
        : inviteStatus === "missing"
          ? pickAdminText(
              locale,
              "We could not find an active invitation for this email. Ask the owner to resend the invitation from Access Center.",
              "لم نعثر على دعوة نشطة لهذا البريد. اطلب من المالك إعادة إرسال الدعوة من مركز الوصول.",
            )
          : inviteStatus === "token_only"
            ? pickAdminText(
                locale,
                "Invitation metadata was detected in the link, but the email context is missing. Continue to sign in or reopen the latest email invite.",
                "تم اكتشاف بيانات الدعوة في الرابط، لكن البريد غير موجود. أكمل إلى تسجيل الدخول أو أعد فتح آخر رسالة دعوة.",
              )
            : pickAdminText(
                locale,
                "Open this page from the invitation email, then continue into admin sign-in.",
                "افتح هذه الصفحة من رسالة الدعوة ثم أكمل إلى تسجيل دخول الإدارة.",
              );

  const primaryHref = inviteStatus === "missing" ? "/admin/users" : loginHref;
  const primaryLabel =
    inviteStatus === "accepted"
      ? pickAdminText(locale, "Sign in to open your workspace", "سجّل الدخول لفتح مساحة عملك")
      : inviteStatus === "missing"
        ? pickAdminText(locale, "Open access center", "افتح مركز الوصول")
        : pickAdminText(locale, "Continue to admin sign-in", "أكمل إلى تسجيل دخول الإدارة");

  const secondaryHref = inviteStatus === "missing" ? loginHref : "/admin/users";
  const secondaryLabel =
    inviteStatus === "missing"
      ? pickAdminText(locale, "Try admin sign-in", "جرّب تسجيل دخول الإدارة")
      : pickAdminText(locale, "Open access center", "افتح مركز الوصول");

  return (
    <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-[min(880px,calc(100%-1.5rem))] items-center py-10 md:py-16">
      <section className="w-full rounded-[36px] border border-white/10 bg-white/5 p-6 shadow-[0_26px_72px_rgba(0,0,0,0.2)] md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f2c16b]">
          {pickAdminText(locale, "Team invitation", "دعوة الفريق")}
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-white md:text-5xl">
          {pickAdminText(locale, "Finish joining the Veyra workspace", "أكمل الانضمام إلى مساحة عمل فيرا")}
        </h1>
        <p className="mt-4 text-base leading-8 text-white/68">
          {pickAdminText(
            locale,
            "Use this page as the stable handoff from invitation email into admin access. We are now checking the invitation state before routing you forward.",
            "استخدم هذه الصفحة كجسر ثابت من رسالة الدعوة إلى دخول الإدارة. النظام الآن يفحص حالة الدعوة قبل توجيهك للخطوة التالية.",
          )}
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className={`rounded-[24px] border p-5 ${statusTone}`}>
            <p className="text-xs uppercase tracking-[0.2em] text-white/42">
              {pickAdminText(locale, "Invite status", "حالة الدعوة")}
            </p>
            <p className="mt-3 text-lg font-semibold text-white">{statusTitle}</p>
            <p className="mt-3 text-sm leading-7 text-white/78">{statusDescription}</p>
            {invitation ? (
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/62">
                <span className="rounded-full border border-white/10 px-3 py-1">
                  {pickAdminText(locale, "Role", "الدور")}: {invitation.role}
                </span>
                <span className="rounded-full border border-white/10 px-3 py-1">
                  {pickAdminText(locale, "Access mode", "وضع الوصول")}: {invitation.accessMode}
                </span>
              </div>
            ) : null}
          </div>

          <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-white/42">
              {pickAdminText(locale, "Invited email", "البريد المدعو")}
            </p>
            <p className="mt-3 break-words text-sm leading-7 text-white/70">
              {invitedEmail ||
                pickAdminText(
                  locale,
                  "Use the invited email at sign-in.",
                  "استخدم البريد المدعو عند تسجيل الدخول.",
                )}
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={primaryHref}
            className="rounded-full bg-gradient-to-r from-[#f2c16b] to-[#c68f43] px-5 py-3 font-semibold text-[#1d140d]"
          >
            {primaryLabel}
          </Link>
          <Link
            href={secondaryHref}
            className="rounded-full border border-white/10 bg-black/20 px-5 py-3 font-semibold text-white/78"
          >
            {secondaryLabel}
          </Link>
        </div>
      </section>
    </div>
  );
}
