export type Unit = {
  id: string;
  type: "Residential" | "Administrative" | "Penthouse";
  image?: string;
  area: number;
  floor: number;
  bedrooms?: number;
  price: number;
  status: "available" | "reserved";
};

export type LocalizedListItem = {
  id: string;
  text: LocalizedText;
};

export type ProjectContent = {
  name?: LocalizedText;
  location?: LocalizedText;
  category?: LocalizedText;
  description?: LocalizedText;
  highlights?: LocalizedListItem[];
  operations?: {
    siteState?: DeliverySiteState;
    progressPercent?: number;
    currentPhase?: string;
    note?: string;
  };
};

export type Project = {
  id: string;
  slug: string;
  name: string;
  location: string;
  category: string;
  description: string;
  heroImage: string;
  gallery: string[];
  startingPricePerMeter: number;
  installmentYears: number;
  featured: boolean;
  highlights: string[];
  units: Unit[];
  content?: ProjectContent;
};

export type PackageContent = {
  name?: LocalizedText;
  summary?: LocalizedText;
  features?: LocalizedListItem[];
};

export type FinishingPackage = {
  id: string;
  name: string;
  pricePerMeter: number;
  summary: string;
  features: string[];
  featured?: boolean;
  content?: PackageContent;
};

export type DeviceContent = {
  name?: LocalizedText;
  summary?: LocalizedText;
  benefits?: LocalizedListItem[];
};

export type SmartDevice = {
  id: string;
  name: string;
  summary: string;
  benefits: string[];
  content?: DeviceContent;
};

export type SmartPackageContent = {
  name?: LocalizedText;
  summary?: LocalizedText;
  devices?: LocalizedListItem[];
};

export type SmartPackage = {
  id: string;
  name: string;
  summary: string;
  devices: string[];
  content?: SmartPackageContent;
};

export type LeadService = "Project Visit" | "Finishing Quote" | "Smart Home Setup";

export type LeadStage =
  | "new"
  | "contacted"
  | "qualified"
  | "site_visit"
  | "negotiation"
  | "closed_won"
  | "closed_lost";

export type LeadPriority = "low" | "medium" | "high";

export type ClientCaseLink =
  | {
      kind: "project";
      id: string;
      label: string;
    }
  | {
      kind: "service";
      id: string;
      label: string;
      serviceType?: string;
    };

export type DeliverySiteState = "existing" | "under_construction" | "not_started";

export type DeliveryReadiness = {
  status: ClientCaseExecutionStatus;
  siteState: DeliverySiteState;
  checklist: {
    teamAssigned: boolean;
    projectLinked: boolean;
    commercialClosed: boolean;
    docsReady: boolean;
  };
  note?: string;
};

export type SiteTracking = {
  siteName?: string;
  progressPercent: number;
  currentPhase: string;
  lastUpdate: string;
  blocker?: string;
  updatedBy?: string;
};

export type ClientCaseDocumentType =
  | "contract"
  | "quotation"
  | "invoice"
  | "receipt"
  | "drawing"
  | "site_photo"
  | "legal_doc"
  | "delivery_report"
  | "other";

export type ClientCaseFileApprovalStatus = "draft" | "submitted" | "approved" | "rejected";

export type ClientCaseFile = {
  id: string;
  displayName: string;
  documentType: ClientCaseDocumentType;
  storagePath: string;
  approvalStatus: ClientCaseFileApprovalStatus;
  uploadedBy?: string;
  linkedTo?: "client_case" | "project" | "service" | "site";
  createdAt: string;
};

export type Lead = {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  service: LeadService;
  message?: string;
  createdAt: string;
  status: "new" | "contacted";
  stage: LeadStage;
  priority: LeadPriority;
  assignedTo?: string;
  source?: string;
  budget?: number;
  lostReason?: string;
  caseAssignments?: ClientCaseAssignment[];
  linkedEntity?: ClientCaseLink;
  deliveryReadiness?: DeliveryReadiness;
  siteTracking?: SiteTracking;
  caseFiles?: ClientCaseFile[];
  roleTasks?: ClientCaseRoleTask[];
};

export type LeadActivity = {
  id: string;
  leadId: string;
  kind: "note" | "stage_change" | "assignment" | "invite_sent";
  body: string;
  createdAt: string;
  createdBy: string;
};

export type ClientCaseStatus = "open" | "won" | "lost";

export type ClientCaseExecutionStatus =
  | "not_started"
  | "needs_assignment"
  | "ready_for_delivery"
  | "in_progress"
  | "blocked"
  | "completed";

export type ClientCaseRoleType =
  | "sales"
  | "operations"
  | "engineer"
  | "worker"
  | "lawyer"
  | "accountant"
  | "marketer";

export type ClientCaseAssignment = {
  role: ClientCaseRoleType;
  assignee?: string;
  status: "unassigned" | "assigned";
};

export type ClientCaseRoleTaskStatus = "todo" | "in_progress" | "blocked" | "done";

export type ClientCaseRoleTask = {
  id: string;
  role: ClientCaseRoleType;
  title: string;
  status: ClientCaseRoleTaskStatus;
  note?: string;
  linkedTo?: "client_case" | "project" | "service" | "site" | "document";
  linkedItemId?: string;
  linkedItemLabel?: string;
  updatedAt: string;
};

export type ClientCase = {
  id: string;
  leadId: string;
  title: string;
  fullName: string;
  phone: string;
  email?: string;
  source?: string;
  service: LeadService;
  stage: LeadStage;
  priority: LeadPriority;
  commercialStatus: ClientCaseStatus;
  executionStatus: ClientCaseExecutionStatus;
  assignedTo?: string;
  assignments: ClientCaseAssignment[];
  nextAction: string;
  lastActivityAt: string;
  createdAt: string;
  budget?: number;
  lostReason?: string;
};

export type ClientCaseSnapshot = {
  totalCases: number;
  openCases: number;
  deliveryReadyCases: number;
  unassignedCases: number;
  blockedCases: number;
};

export type UserRole =
  | "owner"
  | "admin"
  | "editor"
  | "operations"
  | "sales"
  | "engineer"
  | "worker"
  | "lawyer"
  | "accountant"
  | "marketer"
  | "viewer";

export type PermissionKey =
  | "dashboard.view"
  | "settings.manage"
  | "theme.manage"
  | "translations.manage"
  | "seo.manage"
  | "blog.manage"
  | "tracking.manage"
  | "projects.view"
  | "projects.manage"
  | "units.manage"
  | "services.manage"
  | "calculators.manage"
  | "leads.view"
  | "leads.manage"
  | "leads.assign"
  | "operations.view"
  | "operations.manage"
  | "cases.view"
  | "cases.manage"
  | "cases.assign"
  | "sites.view"
  | "sites.manage"
  | "documents.view"
  | "documents.upload"
  | "documents.approve"
  | "finance.view"
  | "finance.manage"
  | "legal.view"
  | "legal.manage"
  | "users.view"
  | "users.invite"
  | "users.manage_roles"
  | "media.upload"
  | "content.publish"
  | "content.delete";

export type AccessMode = "role" | "custom";

export type TeamUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  permissions: PermissionKey[];
  accessMode: AccessMode;
  status: "active" | "invited";
  invitedAt?: string;
  lastSeenAt?: string;
};

export type UserInvitation = {
  id: string;
  email: string;
  role: UserRole;
  permissions: PermissionKey[];
  accessMode: AccessMode;
  status: "pending" | "accepted" | "expired";
  invitedBy: string;
  createdAt: string;
  lastSentAt: string;
};

export type ThemePalette = {
  id: string;
  name: string;
  primary: string;
  accent: string;
  surface: string;
  text: string;
  navBg?: string;    // Header/Nav background color override
  logoBg?: string;   // Background behind logo text/badge
};


export type BrandingSettings = {
  useImageLogo: boolean;
  logoUrl: string;
  logoAlt: LocalizedText;
  logoBackground?: string;   // CSS color behind the logo in the nav (e.g. dark overlay)
};


export type LocaleCode = "en" | "ar";

export type LocalizedText = Record<LocaleCode, string> & {
  color?: string;
};

export type SectionLayoutItem = {
  id: string;
  label: LocalizedText;
  enabled: boolean;
  blockBg?: string;   // Optional CSS background-color override for this section
};


export type HomeServiceLine = {
  id: string;
  title: LocalizedText;
  copy: LocalizedText;
  stat: LocalizedText;
  link: LocalizedText;
};

export type HomeSignal = {
  id: string;
  label: LocalizedText;
  value: LocalizedText;
};

export type HomeDashboardStatCopy = {
  id: string;
  label: LocalizedText;
  hint: LocalizedText;
};

export type DecisionCardCopy = {
  id: string;
  label: LocalizedText;
  title: LocalizedText;
  copy: LocalizedText;
  cta?: LocalizedText;
};

export type ValueCardCopy = {
  id: string;
  label: LocalizedText;
  value: LocalizedText;
  note: LocalizedText;
};

export type FaqItemCopy = {
  id: string;
  question: LocalizedText;
  answer: LocalizedText;
};

export type HomeContent = {
  serviceArchitectureEyebrow: LocalizedText;
  serviceArchitectureTitle: LocalizedText;
  serviceArchitectureDescription: LocalizedText;
  featuredEyebrow: LocalizedText;
  featuredTitle: LocalizedText;
  featuredDescription: LocalizedText;
  leadEyebrow: LocalizedText;
  leadTitle: LocalizedText;
  leadDescription: LocalizedText;
  serviceModulesEyebrow: LocalizedText;
  serviceModulesTitle: LocalizedText;
  serviceModulesDescription: LocalizedText;
  signatureLaunch: LocalizedText;
  primeInventory: LocalizedText;
  unitTypesLabel: LocalizedText;
  investmentFlow: LocalizedText;
  platformMode: LocalizedText;
  separateAdmin: LocalizedText;
  intentEyebrow: LocalizedText;
  intentTitle: LocalizedText;
  intentDescription: LocalizedText;
  trustTitle: LocalizedText;
  bookingTitle: LocalizedText;
  serviceLines: HomeServiceLine[];
  marketSignals: HomeSignal[];
  ribbons: LocalizedListItem[];
  dashboardStats: HomeDashboardStatCopy[];
  intentCards: DecisionCardCopy[];
  trustItems: ValueCardCopy[];
  bookingItems: LocalizedListItem[];
};

export type BasicPageCopy = {
  eyebrow: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
};

export type ProjectsPageCopy = BasicPageCopy & {
  from: LocalizedText;
  installmentsUpTo: LocalizedText;
  years: LocalizedText;
  unitsListed: LocalizedText;
  viewProject: LocalizedText;
  compareTitle: LocalizedText;
  compareLabel: LocalizedText;
  bookVisit: LocalizedText;
  visitReasonTitle: LocalizedText;
  curatedInventoryLabel: LocalizedText;
  curatedInventoryNote: LocalizedText;
  locationsLabel: LocalizedText;
  locationsNote: LocalizedText;
  installmentStatLabel: LocalizedText;
  installmentStatNote: LocalizedText;
  flagshipLabel: LocalizedText;
  launchModeLabel: LocalizedText;
  featuredMode: LocalizedText;
  coreMode: LocalizedText;
  compareItems: DecisionCardCopy[];
  visitReasons: LocalizedListItem[];
};

export type FinishingPageCopy = BasicPageCopy & {
  recommended: LocalizedText;
  package: LocalizedText;
  beforeAfterAlt: LocalizedText;
  whyTitle: LocalizedText;
  processTitle: LocalizedText;
  faqTitle: LocalizedText;
  stickyPrimary: LocalizedText;
  stickySecondary: LocalizedText;
  whyCards: ValueCardCopy[];
  processSteps: LocalizedListItem[];
  faqs: FaqItemCopy[];
};

export type SmartHomePageCopy = BasicPageCopy & {
  howItWorks: LocalizedText;
  steps: LocalizedListItem[];
  whyTitle: LocalizedText;
  useCaseTitle: LocalizedText;
  faqTitle: LocalizedText;
  stickyPrimary: LocalizedText;
  stickySecondary: LocalizedText;
  whyCards: ValueCardCopy[];
  useCases: LocalizedListItem[];
  faqs: FaqItemCopy[];
};

export type ProjectDetailPageCopy = {
  projectHighlights: LocalizedText;
  bookVisit: LocalizedText;
  availableUnits: LocalizedText;
  residentialLabel: LocalizedText;
  administrativeLabel: LocalizedText;
  penthouseLabel: LocalizedText;
  floor: LocalizedText;
  bedrooms: LocalizedText;
  officeReady: LocalizedText;
  requestVisit: LocalizedText;
  requestDescription: LocalizedText;
  upTo: LocalizedText;
  years: LocalizedText;
  sqm: LocalizedText;
  available: LocalizedText;
  reserved: LocalizedText;
  perSqm: LocalizedText;
  visitNow: LocalizedText;
  viewInventory: LocalizedText;
  whyTitle: LocalizedText;
  whyDescription: LocalizedText;
  fitTitle: LocalizedText;
  processTitle: LocalizedText;
  faqTitle: LocalizedText;
  responseTitle: LocalizedText;
  responseText: LocalizedText;
  urgencyTitle: LocalizedText;
  urgencyText: LocalizedText;
  stickyPrimary: LocalizedText;
  stickySecondary: LocalizedText;
  whyCards: ValueCardCopy[];
  fitItems: LocalizedListItem[];
  processSteps: LocalizedListItem[];
  faqs: FaqItemCopy[];
};

export type SitePageContent = {
  home: HomeContent;
  projects: ProjectsPageCopy;
  book: BasicPageCopy;
  finishing: FinishingPageCopy;
  smartHome: SmartHomePageCopy;
  projectDetail: ProjectDetailPageCopy;
};

export type SiteLayouts = {
  home: SectionLayoutItem[];
  projects: SectionLayoutItem[];
  finishing: SectionLayoutItem[];
  smartHome: SectionLayoutItem[];
  book: SectionLayoutItem[];
};

export type SystemBlockPlacementPage = keyof SiteLayouts;

export type SystemBlockConditions = {
  locale?: "all" | "ar" | "en";
  visitorIntent?: "all" | "buy" | "invest" | "finishing" | "smart_home";
};

export type SystemBlockItem = {
  id: string;
  label: LocalizedText;
  zone: "header" | "footer" | "lead";
  pages: SystemBlockPlacementPage[];
  enabled: boolean;
  conditions?: SystemBlockConditions;
};

export type SiteContent = {
  nav: {
    home: LocalizedText;
    projects: LocalizedText;
    finishing: LocalizedText;
    smartHome: LocalizedText;
    book: LocalizedText;
    cta: LocalizedText;
  };
  hero: {
    chip: LocalizedText;
    title: LocalizedText;
    description: LocalizedText;
    primaryCta: LocalizedText;
    secondaryCta: LocalizedText;
  };
  footer: {
    tagline: LocalizedText;
    copyright: LocalizedText;
  };
  leadForm: {
    title: LocalizedText;
    description: LocalizedText;
    fullNameLabel: LocalizedText;
    fullNamePlaceholder: LocalizedText;
    phoneLabel: LocalizedText;
    phonePlaceholder: LocalizedText;
    emailLabel: LocalizedText;
    emailPlaceholder: LocalizedText;
    serviceLabel: LocalizedText;
    projectVisitOption: LocalizedText;
    finishingQuoteOption: LocalizedText;
    smartHomeSetupOption: LocalizedText;
    messageLabel: LocalizedText;
    messagePlaceholder: LocalizedText;
    submitLabel: LocalizedText;
    sendingLabel: LocalizedText;
    successMessage: LocalizedText;
  };
  calculators: {
    installment: {
      eyebrow: LocalizedText;
      title: LocalizedText;
      description: LocalizedText;
      unitTypeLabel: LocalizedText;
      areaLabel: LocalizedText;
      yearsLabel: LocalizedText;
      downPaymentLabel: LocalizedText;
      cashPriceLabel: LocalizedText;
      installmentPriceLabel: LocalizedText;
      monthlyPaymentLabel: LocalizedText;
    };
    finishing: {
      eyebrow: LocalizedText;
      title: LocalizedText;
      description: LocalizedText;
      areaLabel: LocalizedText;
      tierLabel: LocalizedText;
      addOnsLabel: LocalizedText;
      estimatedCostLabel: LocalizedText;
      estimatedNote: LocalizedText;
    };
  };
  pages?: SitePageContent;
  layouts?: SiteLayouts;
  systemBlocks?: SystemBlockItem[];
};

export type InstallmentUnitType = {
  id: string;
  label: LocalizedText;
  pricePerMeter: number;
};

export type InstallmentPlan = {
  id: string;
  label: LocalizedText;
  years: number;
  interestMultiplier: number;
};

export type InstallmentCalculatorSettings = {
  unitTypes: InstallmentUnitType[];
  areaOptions: number[];
  downPaymentOptions: number[];
  plans: InstallmentPlan[];
  defaultUnitTypeId: string;
  defaultArea: number;
  defaultPlanId: string;
  defaultDownPayment: number;
};

export type FinishingTier = {
  id: string;
  label: LocalizedText;
  pricePerMeter: number;
};

export type CalculatorAddOn = {
  id: string;
  label: LocalizedText;
  price: number;
};

export type FinishingCalculatorSettings = {
  areaOptions: number[];
  tiers: FinishingTier[];
  addOns: CalculatorAddOn[];
  defaultArea: number;
  defaultTierId: string;
  defaultAddOnIds: string[];
};

export type SiteSettings = {
  id?: string;
  companyName: string;
  primaryLocale: LocaleCode;
  supportedLocales: LocaleCode[];
  paletteId: string;
  palettes: ThemePalette[];
  branding: BrandingSettings;
  content: SiteContent;
  installmentCalculator: InstallmentCalculatorSettings;
  finishingCalculator: FinishingCalculatorSettings;
  hazemAi: HazemAiSettings;
};

export type HazemProvider = "groq" | "openai" | "custom";

export type HazemSystemPrompts = {
  website: string;
  admin: string;
};

export type HazemAnalysisSettings = {
  enabled: boolean;
  summaryPrompt: string;
  classificationPrompt: string;
  qualityPrompt: string;
  recommendationsPrompt: string;
  autoInsights: string[];
  managerNotes: string;
};

export type HazemAiSettings = {
  enabled: boolean;
  provider: HazemProvider;
  model: string;
  apiKey: string;
  websiteAssistantName: string;
  adminAssistantName: string;
  forceEgyptianDialect: boolean;
  systemPrompts: HazemSystemPrompts;
  analysis: HazemAnalysisSettings;
};

export type DashboardStat = {
  id?: string;
  label: string;
  value: string;
  hint: string;
};

export type CrmSnapshot = {
  stageCounts: Record<LeadStage, number>;
  totalLeads: number;
  pendingInvites: number;
  activeUsers: number;
};

export type ServiceCatalog = {
  finishingPackages: FinishingPackage[];
  smartDevices: SmartDevice[];
  smartPackages: SmartPackage[];
};

export type BlogPostStatus = "draft" | "published";

export type BlogCategory = {
  id: string;
  name: string;
  slug: string;
};

export type BlogTag = {
  id: string;
  name: string;
  slug: string;
};

export type SeoFields = {
  metaTitle: string;
  metaDescription: string;
  slug: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  noIndex?: boolean;
};

export type BlogPost = {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  author: string;
  categoryId?: string;
  tagIds: string[];
  status: BlogPostStatus;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  seo: SeoFields;
};

export type SeoPageConfig = {
  id: string;
  pageKey: string;
  label: string;
  seo: SeoFields;
  updatedAt: string;
};

export type MarketingTrackingSettings = {
  id?: string;
  googleTagManagerId?: string;
  googleAnalytics4MeasurementId?: string;
  metaPixelId?: string;
  tiktokPixelId?: string;
  enableGTM: boolean;
  enableGA4: boolean;
  enableMetaPixel: boolean;
  enableTikTokPixel: boolean;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  trackPurchases: boolean;
  trackLeadSubmissions: boolean;
  trackPageViews: boolean;
  trackScrollDepth: boolean;
  trackVideoEngagement: boolean;
  eventMappings: Record<string, string>;
  customEvents: Array<{
    name: string;
    parameters: Record<string, string>;
  }>;
  updatedAt?: string;
  updatedBy?: string;
};
