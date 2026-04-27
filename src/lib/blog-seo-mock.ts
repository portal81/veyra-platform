import type { BlogCategory, BlogPost, BlogTag, SeoPageConfig } from "@/lib/types";

export const blogCategories: BlogCategory[] = [
  { id: "cat-market", name: "Market Insights", slug: "market-insights" },
  { id: "cat-buyers", name: "Buyer Guides", slug: "buyer-guides" },
  { id: "cat-finish", name: "Finishing", slug: "finishing" },
];

export const blogTags: BlogTag[] = [
  { id: "tag-zagazig", name: "Zagazig", slug: "zagazig" },
  { id: "tag-installments", name: "Installments", slug: "installments" },
  { id: "tag-smart-home", name: "Smart Home", slug: "smart-home" },
];

export const blogPosts: BlogPost[] = [
  {
    id: "post-investment-zagazig-2026",
    title: "Zagazig Real Estate Outlook 2026",
    excerpt: "What serious buyers should watch before booking a site visit.",
    content:
      "This draft outlines demand zones, installment trends, and practical guidance for buyer decisions.",
    author: "Veyra Editorial",
    categoryId: "cat-market",
    tagIds: ["tag-zagazig", "tag-installments"],
    status: "draft",
    createdAt: "2026-04-08T09:00:00.000Z",
    updatedAt: "2026-04-09T10:30:00.000Z",
    seo: {
      metaTitle: "Zagazig Real Estate Outlook 2026 | Veyra",
      metaDescription: "Demand, pricing bands, and installment strategy for buyers in Zagazig.",
      slug: "zagazig-real-estate-outlook-2026",
      ogTitle: "Zagazig Real Estate Outlook 2026",
      ogDescription: "A practical investment brief from Veyra.",
      noIndex: false,
    },
  },
];

export const seoPageConfigs: SeoPageConfig[] = [
  {
    id: "seo-home",
    pageKey: "home",
    label: "Homepage",
    updatedAt: "2026-04-09T10:30:00.000Z",
    seo: {
      metaTitle: "Veyra Developments | Luxury Real Estate, Finishing, Smart Home",
      metaDescription:
        "Explore premium projects, finishing packages, and smart-home services from one platform.",
      slug: "",
      canonicalUrl: "https://veyra-platform.vercel.app/",
      ogTitle: "Veyra Developments",
      ogDescription: "Luxury property experience powered by Veyra.",
      noIndex: false,
    },
  },
  {
    id: "seo-projects",
    pageKey: "projects",
    label: "Projects Listing",
    updatedAt: "2026-04-09T10:30:00.000Z",
    seo: {
      metaTitle: "Projects | Veyra Developments",
      metaDescription: "Browse active projects, prices, and installment plans.",
      slug: "projects",
      canonicalUrl: "https://veyra-platform.vercel.app/projects",
      noIndex: false,
    },
  },
];
