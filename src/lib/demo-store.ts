import {
  finishingPackages,
  initialLeadActivities,
  initialLeads,
  projects,
  siteSettings,
  smartDevices,
  smartPackages,
  teamUsers,
  userInvitations,
} from "@/lib/mock-data";
import {
  blogCategories,
  blogPosts,
  blogTags,
  seoPageConfigs,
} from "@/lib/blog-seo-mock";
import type {
  FinishingPackage,
  Lead,
  LeadActivity,
  MarketingTrackingSettings,
  Project,
  SiteSettings,
  SeoPageConfig,
  SmartDevice,
  SmartPackage,
  TeamUser,
  UserInvitation,
  BlogCategory,
  BlogPost,
  BlogTag,
} from "@/lib/types";

type DemoStore = {
  projects: Project[];
  leads: Lead[];
  leadActivities: LeadActivity[];
  invitations: UserInvitation[];
  users: TeamUser[];
  siteSettings: SiteSettings;
  finishingPackages: FinishingPackage[];
  smartDevices: SmartDevice[];
  smartPackages: SmartPackage[];
  blogPosts: BlogPost[];
  blogCategories: BlogCategory[];
  blogTags: BlogTag[];
  seoPages: SeoPageConfig[];
  marketingTracking?: MarketingTrackingSettings;
};

const globalForDemo = globalThis as typeof globalThis & {
  __veyraDemoStore?: DemoStore;
};

export const demoStore: DemoStore =
  globalForDemo.__veyraDemoStore ??
  (globalForDemo.__veyraDemoStore = {
    projects: structuredClone(projects),
    leads: structuredClone(initialLeads),
    leadActivities: structuredClone(initialLeadActivities),
    invitations: structuredClone(userInvitations),
    users: structuredClone(teamUsers),
    siteSettings: structuredClone(siteSettings),
    finishingPackages: structuredClone(finishingPackages),
    smartDevices: structuredClone(smartDevices),
    smartPackages: structuredClone(smartPackages),
    blogPosts: structuredClone(blogPosts),
    blogCategories: structuredClone(blogCategories),
    blogTags: structuredClone(blogTags),
    seoPages: structuredClone(seoPageConfigs),
    marketingTracking: {
      enableGTM: false,
      enableGA4: false,
      enableMetaPixel: false,
      enableTikTokPixel: false,
      trackPurchases: false,
      trackLeadSubmissions: true,
      trackPageViews: true,
      trackScrollDepth: false,
      trackVideoEngagement: false,
      eventMappings: {},
      customEvents: [],
      updatedAt: new Date().toISOString(),
    },
  });
