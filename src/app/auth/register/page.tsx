"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { createSupabaseBrowserClient } from "@/lib/supa";
import { useAdminLocale } from "@/components/admin/admin-locale-provider";

function RegisterContent() {
  const { direction } = useAdminLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const companyId = searchParams.get("company_id") || "";
  const initialEmail = searchParams.get("email") || "";
  const inviteToken = searchParams.get("token") || "";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) {
      setErrorMsg("معرف الشركة العقارية مفقود. يرجى الاشتراك أولاً.");
      return;
    }
    if (!inviteToken) {
      setErrorMsg("رابط التسجيل غير صالح. يرجى استخدام رابط الدعوة الرسمي.");
      return;
    }
    if (!fullName || !email || !phone || !password) {
      setErrorMsg("الرجاء تعبئة كافة الحقول المطلوبة.");
      return;
    }
    if (password.length < 8) {
      setErrorMsg("كلمة المرور يجب أن تكون 8 أحرف على الأقل.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        throw new Error("قاعدة البيانات غير متصلة محلياً.");
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (authError) throw authError;
      if (!authData.user) {
        throw new Error("فشل إنشاء المستخدم في نظام المصادقة.");
      }

      const { error: userInsertError } = await supabase
        .from("users")
        .insert({
          id: authData.user.id,
          name: fullName,
          email: email,
          phone: phone,
          role: "viewer",
          company_id: companyId,
          is_archived: false
        });

      if (userInsertError) throw userInsertError;

      alert("تم إنشاء الحساب بنجاح! يرجى تسجيل الدخول.");
      router.push("/auth/login");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "حدث خطأ غير متوقع أثناء التسجيل.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4 font-sans" dir={direction}>
      <div className="bg-white rounded-2xl p-8 max-w-md w-full border border-slate-100 shadow-sm">
        <div className="text-center mb-6">
          <span className="text-[#B89D74] text-xs uppercase tracking-widest font-semibold">إنشاء حساب جديد</span>
          <h2 className="text-2xl font-bold text-[#1A202C] mt-1 font-serif">تسجيل حساب المدير التنفيذي</h2>
          <p className="text-xs text-slate-500 mt-2">قم بتهيئة بياناتك الشخصية للدخول إلى لوحة التحكم الإدارية.</p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg mb-4 text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#2D3748] mb-1">الاسم بالكامل *</label>
            <input
              type="text"
              required
              placeholder="الاسم الثلاثي"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#B89D74]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2D3748] mb-1">البريد الإلكتروني *</label>
            <input
              type="email"
              required
              placeholder="mail@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#B89D74]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2D3748] mb-1">رقم الهاتف الجوال *</label>
            <input
              type="tel"
              required
              placeholder="01xxxxxxxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#B89D74]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2D3748] mb-1">كلمة المرور *</label>
            <input
              type="password"
              required
              placeholder="أكثر من 6 خانات"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#B89D74]"
            />
          </div>

          <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-500 space-y-1">
            <div><strong>معرف الشركة المرتبط:</strong> {companyId || "مفقود! يرجى الاشتراك أولاً"}</div>
            <div><strong>الصلاحية الممنوحة:</strong> مدير تنفيذي (CEO)</div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#0F4C3A] hover:bg-[#0b382b] disabled:bg-slate-300 text-white rounded-lg font-bold text-sm transition-colors mt-2"
          >
            {loading ? "جاري إنشاء الحساب وإعداد مساحة العمل..." : "تسجيل وإنشاء الحساب"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="text-center py-20">جاري تحميل صفحة التسجيل...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
