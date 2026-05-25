import { AdminLoginForm } from "@/components/auth/admin-login-form";
import { getCurrentAdminLocale } from "@/lib/admin-locale-server";
import { pickAdminText } from "@/lib/admin-locale";
import { isDevMode } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const locale = await getCurrentAdminLocale();
  const devMode = isDevMode();

  return (
    <div className="mx-auto w-[min(1120px,calc(100%-1.5rem))] py-10 md:py-16">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <section className="rounded-[36px] border border-white/10 bg-white/5 p-6 shadow-[0_26px_72px_rgba(0,0,0,0.2)] md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f2c16b]">
            {pickAdminText(locale, "Owner access", "دخول المالك")}
          </p>
          <h2 className="mt-3 font-serif text-4xl text-white">{pickAdminText(locale, "Secure entry for the admin domain", "دخول آمن إلى دومين الإدارة")}</h2>
          <p className="mt-4 text-base leading-8 text-white/66">
            {pickAdminText(
              locale,
              "This domain now supports a dedicated sign-in flow for the owner and invited users. Use email and password to enter the admin workspace.",
              "هذا الدومين يدعم الآن مسار تسجيل دخول مستقل للمالك والمستخدمين المدعوين. استخدم البريد وكلمة المرور للدخول إلى مساحة الإدارة.",
            )}
          </p>

          <div className="mt-8 grid gap-4">
            <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/42">{pickAdminText(locale, "What is enabled", "المفعل حاليًا")}</p>
              <ul className="mt-3 grid gap-2 text-sm text-white/68">
                <li>{pickAdminText(locale, "Email + password admin login", "تسجيل دخول بريد إلكتروني + كلمة مرور")}</li>
                <li>{pickAdminText(locale, "Owner bootstrap support through Supabase Auth", "دعم إنشاء المالك عبر Supabase Auth")}</li>
                <li>{pickAdminText(locale, "Role and permission aware admin sessions", "جلسات إدارة مرتبطة بالأدوار والصلاحيات")}</li>
              </ul>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/42">{pickAdminText(locale, "Next external step", "الخطوة الخارجية التالية")}</p>
              <p className="mt-3 text-sm leading-7 text-white/68">
                {pickAdminText(
                  locale,
                  "Gmail SMTP still needs to be configured in Supabase for live confirmation and invitation emails to leave from your Gmail account.",
                  "ما زال إعداد Gmail SMTP مطلوبًا داخل Supabase حتى تخرج رسائل التأكيد والدعوات من حساب Gmail الخاص بك.",
                )}
              </p>
            </div>
          </div>
        </section>

        <AdminLoginForm devMode={devMode} />
      </div>
    </div>
  );
}
