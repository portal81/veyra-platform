import { redirect } from "next/navigation";
import { SaaSPageShell } from "@/components/admin/saas-page-shell";
import { BlogCmsBuilder } from "@/components/admin/blog-cms-builder";
import { getAdminSession } from "@/lib/admin-auth";
import { getCurrentAdminLocale } from "@/lib/admin-locale-server";
import { pickAdminText } from "@/lib/admin-locale";
import { hasPermission } from "@/lib/admin-session";
import { getBlogCategories, getBlogPosts, getBlogTags } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const locale = await getCurrentAdminLocale();
  const session = await getAdminSession();
  if (!hasPermission(session, "blog.manage")) {
    redirect("/admin");
  }

  const [posts, categories, tags] = await Promise.all([
    getBlogPosts(),
    getBlogCategories(),
    getBlogTags(),
  ]);

  return (
    <SaaSPageShell
      title={pickAdminText(locale, "Blog CMS", "إدارة المدونة")}
      description={pickAdminText(
        locale,
        "Create and publish real-estate articles with SEO-ready metadata.",
        "أنشئ مقالات عقارية مع إعدادات SEO جاهزة للنشر.",
      )}
    >
      <div className="admin-shell-panel overflow-hidden p-6 md:p-8">
        <BlogCmsBuilder initialPosts={posts} categories={categories} tags={tags} />
      </div>
    </SaaSPageShell>
  );
}
