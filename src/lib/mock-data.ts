import type {
  CrmSnapshot,
  DashboardStat,
  FinishingPackage,
  Lead,
  LeadActivity,
  Project,
  SiteSettings,
  SmartDevice,
  SmartPackage,
  TeamUser,
  UserInvitation,
} from "@/lib/types";
import { getRolePermissions } from "@/lib/permissions";

export const dashboardStats: DashboardStat[] = [
  { id: "projects", label: "Projects", value: "3", hint: "Flagship developments ready for a scalable catalogue." },
  { id: "open-leads", label: "Open Leads", value: "18", hint: "Requests currently waiting for admin follow-up." },
  { id: "services", label: "Services", value: "3", hint: "Real Estate, Finishing, and Smart Home." },
  { id: "response-sla", label: "Response SLA", value: "30 min", hint: "Target response time for newly submitted leads." },
];

export const siteSettings: SiteSettings = {
  id: "primary",
  companyName: "Veyra Developments",
  primaryLocale: "en",
  supportedLocales: ["en", "ar"],
  paletteId: "gold-ivory",
  branding: {
    useImageLogo: false,
    logoUrl: "",
    logoAlt: {
      en: "Veyra Developments logo",
      ar: "شعار Veyra Developments",
    },
  },
  palettes: [
    {
      id: "gold-ivory",
      name: "Gold Ivory",
      primary: "#d4a44f",
      accent: "#b77b2f",
      surface: "#f7f1e7",
      text: "#241b13",
    },
    {
      id: "gold-noir",
      name: "Champagne Gold",
      primary: "#e0b867",
      accent: "#bc8740",
      surface: "#fff8ee",
      text: "#241b13",
    },
    {
      id: "sandstone",
      name: "Sandstone Light",
      primary: "#d8b072",
      accent: "#8c6a44",
      surface: "#faf3e8",
      text: "#2b2118",
    },
    {
      id: "copper-blue",
      name: "Pearl Blue",
      primary: "#d19a5b",
      accent: "#6f9bb4",
      surface: "#fbf6ef",
      text: "#241b13",
    },
  ],
  hazemAi: {
    enabled: true,
    provider: "groq",
    model: "llama-3.3-70b-versatile",
    apiKey: "",
    websiteAssistantName: "حازم",
    adminAssistantName: "حازم الإداري",
    forceEgyptianDialect: true,
    systemPrompts: {
      website: `You are Hazem, Veyra's public sales assistant.
Reason internally in English, but final response to users must be in Egyptian Arabic colloquial dialect using Arabic script.
Use only internal Veyra data available in runtime context (projects, units, prices, installment calculators, finishing/smart-home packages, and configured published content).
Never invent prices, availability, locations, handover dates, or offers.
If data is missing, say it clearly in Egyptian Arabic and offer next action (book visit, callback, or WhatsApp continuation).
Your goal is conversion: qualify intent, ask one focused question per turn, recommend up to 3 matching options, and end with one clear CTA.
Tone: friendly, confident, concise, sales-professional.
Never output English unless explicitly requested by the user.`,
      admin: `You are Hazem Admin, Veyra's internal strategic advisor for management and operations.
Reason internally in English, but final response must be in Egyptian Arabic colloquial dialect using Arabic script.
Use only internal admin/runtime data (settings, projects/services catalogs, CRM pipeline and activity, SEO/blog/tracking configuration).
Do not fabricate KPIs or external facts.
When data is incomplete, explicitly mark data gap and request minimum missing inputs.
For each recommendation, provide: current state, root cause, business impact, action plan (quick + mid-term), KPI, risks, and next best action.
Prioritize by P1/P2/P3 and keep output practical, concise, and executable.`,
    },
    analysis: {
      enabled: true,
      summaryPrompt: `Analyze Hazem conversations using only internal conversation logs and CRM data.
Output in Egyptian Arabic with this structure:
1) Executive summary
2) Top repeated intents/questions
3) Objections and lost reasons
4) Conversion blockers
5) Recommended actions for sales team
6) Recommended product/content updates
7) KPIs to track next 7 days`,
      classificationPrompt: `Classify each conversation into:
- intent (buy/invest/finishing/smart-home/support)
- stage (new/contacted/qualified/site_visit/negotiation/closed_won/closed_lost)
- lead temperature (cold/warm/hot)
- next best action
Use only available internal conversation and CRM signals. Output in Egyptian Arabic.`,
      qualityPrompt: `Evaluate Hazem response quality on:
1) Data accuracy (internal-only)
2) Clarity in Egyptian Arabic
3) Qualification depth
4) CTA strength
5) Compliance (no hallucination)
Return a 0-100 score with short reasons in Egyptian Arabic.`,
      recommendationsPrompt: `Generate weekly optimization recommendations for:
- sales scripts
- objection handling
- page content gaps
- CRM follow-up timing
- conversion bottlenecks
Prioritize P1/P2/P3 with KPI for each recommendation.
Output in Egyptian Arabic.`,
      autoInsights: [
        "راجع نسبة التحويل من chat إلى Book Visit يوميًا وقارنها بالمصدر.",
        "استخرج أعلى 5 اعتراضات متكررة وحدث ردود حازم عليها أسبوعيًا.",
        "اربط كل محادثة غير مغلقة بمتابعة CRM خلال أقل من 30 دقيقة.",
        "راقب أكثر صفحات مسببة لأسئلة غير واضحة واطلب تحسين المحتوى فيها.",
      ],
      managerNotes: "",
    },
  },
  content: {
    nav: {
      home: { en: "Home", ar: "الرئيسية" },
      projects: { en: "Projects", ar: "المشروعات" },
      finishing: { en: "Finishing", ar: "التشطيب" },
      smartHome: { en: "Smart Home", ar: "المنزل الذكي" },
      book: { en: "Book a Visit", ar: "احجز زيارة" },
      cta: { en: "Book a Visit", ar: "احجز زيارة" },
    },
    hero: {
      chip: {
        en: "Luxury Real Estate / Finishing / Smart Homes",
        ar: "عقارات فاخرة / تشطيب / منازل ذكية",
      },
      title: {
        en: "Building Modern Living",
        ar: "نبني أسلوب معيشة عصري",
      },
      description: {
        en: "A premium digital flagship for projects, finishing, and smart-home journeys under one luxury real-estate brand.",
        ar: "منصة رقمية فاخرة تجمع المشروعات والتشطيب وتجارب المنزل الذكي تحت علامة عقارية واحدة.",
      },
      primaryCta: { en: "Explore Projects", ar: "استكشف المشروعات" },
      secondaryCta: { en: "Book a Visit", ar: "احجز زيارة" },
    },
    footer: {
      tagline: {
        en: "Luxury real estate, finishing, and smart home experiences by Veyra.",
        ar: "تجارب عقارية وتشطيب ومنازل ذكية فاخرة من Veyra.",
      },
      copyright: {
        en: "All rights reserved to Veyra Developments.",
        ar: "جميع الحقوق محفوظة لـ Veyra Developments.",
      },
    },
    leadForm: {
      title: {
        en: "Request a callback",
        ar: "اطلب معاودة الاتصال",
      },
      description: {
        en: "Send your request and the sales team will continue the journey from the right service line.",
        ar: "أرسل طلبك وسيكمل فريق المبيعات الرحلة من القسم المناسب.",
      },
      fullNameLabel: { en: "Full Name", ar: "الاسم الكامل" },
      fullNamePlaceholder: { en: "Your name", ar: "اكتب اسمك" },
      phoneLabel: { en: "Phone Number", ar: "رقم الهاتف" },
      phonePlaceholder: { en: "+20 10X XXX XXXX", ar: "+20 10X XXX XXXX" },
        emailLabel: { en: "Email Address", ar: "البريد الإلكتروني" },
        emailPlaceholder: { en: "name@example.com", ar: "name@example.com" },
        serviceLabel: { en: "Requested Service", ar: "الخدمة المطلوبة" },
        projectVisitOption: { en: "Project Visit", ar: "زيارة مشروع" },
        finishingQuoteOption: { en: "Finishing Quote", ar: "عرض سعر تشطيب" },
        smartHomeSetupOption: { en: "Smart Home Setup", ar: "تركيب منزل ذكي" },
        messageLabel: { en: "Project Brief", ar: "ملخص الطلب" },
      messagePlaceholder: {
        en: "Tell us what you need",
        ar: "اكتب احتياجك أو تفاصيل طلبك",
      },
      submitLabel: { en: "Send Request", ar: "إرسال الطلب" },
      sendingLabel: { en: "Sending...", ar: "جارٍ الإرسال..." },
      successMessage: {
        en: "Lead saved successfully.",
        ar: "تم حفظ الطلب بنجاح.",
      },
    },
    calculators: {
      installment: {
        eyebrow: { en: "Installments", ar: "التقسيط" },
        title: {
          en: "Investment tools with controllable pricing logic.",
          ar: "أدوات استثمار بمنطق تسعير قابل للتحكم.",
        },
        description: {
          en: "Unit type, meter price, installment years, and down payment all come from admin-controlled settings.",
          ar: "نوع الوحدة وسعر المتر وعدد سنوات التقسيط والدفعة المقدمة كلها تأتي من إعدادات الإدارة.",
        },
        unitTypeLabel: { en: "Unit Type", ar: "نوع الوحدة" },
        areaLabel: { en: "Area (m²)", ar: "المساحة (م²)" },
        yearsLabel: { en: "Installment Years", ar: "سنوات التقسيط" },
        downPaymentLabel: { en: "Down Payment", ar: "الدفعة المقدمة" },
        cashPriceLabel: { en: "Cash Price", ar: "السعر النقدي" },
        installmentPriceLabel: { en: "Installment Price", ar: "سعر التقسيط" },
        monthlyPaymentLabel: { en: "Monthly Payment", ar: "القسط الشهري" },
      },
      finishing: {
        eyebrow: { en: "Finishing", ar: "التشطيب" },
        title: {
          en: "Package-driven finishing estimates.",
          ar: "تقديرات تشطيب مبنية على الباقات.",
        },
        description: {
          en: "Area, tier, and optional upgrades are editable from the admin builder.",
          ar: "المساحة ونوع التشطيب والإضافات الاختيارية كلها قابلة للتعديل من لوحة الإدارة.",
        },
        areaLabel: { en: "Apartment Area", ar: "مساحة الشقة" },
        tierLabel: { en: "Finishing Tier", ar: "فئة التشطيب" },
        addOnsLabel: { en: "Optional Upgrades", ar: "الإضافات الاختيارية" },
        estimatedCostLabel: { en: "Estimated Cost", ar: "التكلفة التقديرية" },
        estimatedNote: {
          en: "Final pricing is confirmed after site inspection, but this estimate gives the client a real starting point.",
          ar: "يتم تأكيد السعر النهائي بعد المعاينة، لكن هذا التقدير يمنح العميل نقطة بداية حقيقية.",
        },
      },
    },
  },
  installmentCalculator: {
    unitTypes: [
      {
        id: "residential",
        label: { en: "Residential", ar: "سكني" },
        pricePerMeter: 20000,
      },
      {
        id: "administrative",
        label: { en: "Administrative", ar: "إداري" },
        pricePerMeter: 40000,
      },
      {
        id: "penthouse",
        label: { en: "Penthouse", ar: "بنتهاوس" },
        pricePerMeter: 35000,
      },
    ],
    areaOptions: [83, 105, 128, 150, 220],
    downPaymentOptions: [10, 15, 20, 25, 30],
    plans: [
      {
        id: "plan-3",
        label: { en: "3 years", ar: "3 سنوات" },
        years: 3,
        interestMultiplier: 1.05,
      },
      {
        id: "plan-5",
        label: { en: "5 years", ar: "5 سنوات" },
        years: 5,
        interestMultiplier: 1.11,
      },
      {
        id: "plan-6",
        label: { en: "6 years", ar: "6 سنوات" },
        years: 6,
        interestMultiplier: 1.14,
      },
      {
        id: "plan-7",
        label: { en: "7 years", ar: "7 سنوات" },
        years: 7,
        interestMultiplier: 1.18,
      },
    ],
    defaultUnitTypeId: "residential",
    defaultArea: 150,
    defaultPlanId: "plan-6",
    defaultDownPayment: 20,
  },
  finishingCalculator: {
    areaOptions: [90, 120, 140, 160, 200],
    tiers: [
      {
        id: "finish-half",
        label: { en: "Half Finish", ar: "نص تشطيب" },
        pricePerMeter: 1100,
      },
      {
        id: "finish-basic",
        label: { en: "Basic", ar: "عادي" },
        pricePerMeter: 2200,
      },
      {
        id: "finish-super",
        label: { en: "Super Lux", ar: "سوبر لوكس" },
        pricePerMeter: 3600,
      },
      {
        id: "finish-ultra",
        label: { en: "Ultra Super Lux", ar: "ألترا سوبر لوكس" },
        pricePerMeter: 5200,
      },
    ],

    addOns: [
      {
        id: "lighting",
        label: { en: "Decorative lighting", ar: "إضاءة ديكورية" },
        price: 35000,
      },
      {
        id: "smart-prep",
        label: { en: "Smart home readiness", ar: "تجهيز منزل ذكي" },
        price: 42000,
      },
      {
        id: "woodworks",
        label: { en: "Custom woodworks", ar: "أعمال خشبية خاصة" },
        price: 58000,
      },
    ],
    defaultArea: 120,
    defaultTierId: "finish-super",
    defaultAddOnIds: [],
  },
};

export const projects: Project[] = [
  {
    id: "prj-al-hamd",
    slug: "al-hamd-tower",
    name: "AL HAMD TOWER",
    location: "Zagazig",
    category: "Mixed-use Development",
    description:
      "A premium mixed-use tower with residential and administrative inventory, designed around faster unit discovery, visit booking, and installment planning.",
    heroImage: "/scenes/tower-close.svg",
    gallery: ["/scenes/tower-close.svg", "/scenes/skyline-dusk.svg", "/scenes/book-visit.svg"],
    startingPricePerMeter: 20000,
    installmentYears: 6,
    featured: true,
    highlights: [
      "Prime address in the heart of Zagazig",
      "Residential and administrative units in one project",
      "Flexible installment plans up to 6 years",
    ],
    content: {
      name: { en: "AL HAMD TOWER", ar: "برج الحمد" },
      location: { en: "Zagazig", ar: "الزقازيق" },
      category: { en: "Mixed-use Development", ar: "مشروع متعدد الاستخدامات" },
      description: {
        en: "A premium mixed-use tower with residential and administrative inventory, designed around faster unit discovery, visit booking, and installment planning.",
        ar: "برج فاخر متعدد الاستخدامات يضم وحدات سكنية وإدارية، ومصمم لتسهيل اكتشاف الوحدات وحجز الزيارات وخطط التقسيط.",
      },
      highlights: [
        { id: "prj-al-hamd-h1", text: { en: "Prime address in the heart of Zagazig", ar: "موقع مميز في قلب الزقازيق" } },
        { id: "prj-al-hamd-h2", text: { en: "Residential and administrative units in one project", ar: "وحدات سكنية وإدارية داخل مشروع واحد" } },
        { id: "prj-al-hamd-h3", text: { en: "Flexible installment plans up to 6 years", ar: "خطط تقسيط مرنة حتى 6 سنوات" } },
      ],
    },
    units: [
      { id: "u-1", type: "Residential", image: "/scenes/residences.svg", area: 150, floor: 9, bedrooms: 3, price: 3000000, status: "available" },
      { id: "u-2", type: "Administrative", image: "/scenes/business-tower.svg", area: 83, floor: 1, price: 3320000, status: "available" },
      { id: "u-3", type: "Penthouse", image: "/scenes/tower-close.svg", area: 220, floor: 25, bedrooms: 4, price: 7700000, status: "reserved" },
    ],
  },
  {
    id: "prj-noor",
    slug: "noor-business-tower",
    name: "Noor Business Tower",
    location: "New Cairo",
    category: "Administrative",
    description:
      "A modern office-led destination focused on clear comparisons, cleaner lead capture, and a polished route from listing to consultation.",
    heroImage: "/scenes/business-tower.svg",
    gallery: ["/scenes/business-tower.svg", "/scenes/skyline-dusk.svg"],
    startingPricePerMeter: 40000,
    installmentYears: 5,
    featured: true,
    highlights: [
      "Flexible office sizes for growing teams",
      "Connected business location with premium access",
      "Future-ready infrastructure for smart office upgrades",
    ],
    content: {
      name: { en: "Noor Business Tower", ar: "برج نور للأعمال" },
      location: { en: "New Cairo", ar: "القاهرة الجديدة" },
      category: { en: "Administrative", ar: "إداري" },
      description: {
        en: "A modern office-led destination focused on clear comparisons, cleaner lead capture, and a polished route from listing to consultation.",
        ar: "وجهة إدارية حديثة تركّز على المقارنات الواضحة وتجميع الطلبات بشكل أنظف ومسار أكثر احترافية من العرض إلى الاستشارة.",
      },
      highlights: [
        { id: "prj-noor-h1", text: { en: "Flexible office sizes for growing teams", ar: "مساحات مكتبية مرنة للفرق المتنامية" } },
        { id: "prj-noor-h2", text: { en: "Connected business location with premium access", ar: "موقع أعمال متصل مع وصول مميز" } },
        { id: "prj-noor-h3", text: { en: "Future-ready infrastructure for smart office upgrades", ar: "بنية تحتية جاهزة لترقيات المكاتب الذكية" } },
      ],
    },
    units: [
      { id: "u-4", type: "Administrative", image: "/scenes/business-tower.svg", area: 72, floor: 5, price: 2880000, status: "available" },
      { id: "u-5", type: "Administrative", image: "/scenes/book-visit.svg", area: 105, floor: 8, price: 4200000, status: "available" },
    ],
  },
  {
    id: "prj-palm",
    slug: "palm-residences",
    name: "Palm Residences",
    location: "Shorouk",
    category: "Residential",
    description:
      "A family-focused residential community with add-on finishing and smart home services offered through the same premium platform.",
    heroImage: "/scenes/residences.svg",
    gallery: ["/scenes/residences.svg", "/scenes/finishing-interior.svg"],
    startingPricePerMeter: 31000,
    installmentYears: 7,
    featured: false,
    highlights: [
      "Generous family-friendly layouts",
      "Finishing and smart home packages available after purchase",
      "Green pockets and community amenities throughout the project",
    ],
    content: {
      name: { en: "Palm Residences", ar: "بالم ريزيدنسز" },
      location: { en: "Shorouk", ar: "الشروق" },
      category: { en: "Residential", ar: "سكني" },
      description: {
        en: "A family-focused residential community with add-on finishing and smart home services offered through the same premium platform.",
        ar: "مجتمع سكني موجه للعائلات مع خدمات تشطيب ومنزل ذكي كإضافات مقدمة من نفس المنصة الفاخرة.",
      },
      highlights: [
        { id: "prj-palm-h1", text: { en: "Generous family-friendly layouts", ar: "مساحات رحبة مناسبة للعائلات" } },
        { id: "prj-palm-h2", text: { en: "Finishing and smart home packages available after purchase", ar: "باقات تشطيب ومنزل ذكي متاحة بعد الشراء" } },
        { id: "prj-palm-h3", text: { en: "Green pockets and community amenities throughout the project", ar: "مساحات خضراء وخدمات مجتمعية داخل المشروع" } },
      ],
    },
    units: [
      { id: "u-6", type: "Residential", image: "/scenes/residences.svg", area: 128, floor: 4, bedrooms: 3, price: 3968000, status: "available" },
    ],
  },
];

export const finishingPackages: FinishingPackage[] = [
  {
    id: "pkg-basic",
    name: "Basic Finishing",
    pricePerMeter: 2200,
    summary: "A practical scope for faster handover and budget-conscious delivery.",
    features: ["Electrical works", "Plumbing", "Base paint", "Organized handover"],
    content: {
      name: { en: "Basic Finishing", ar: "تشطيب عادي" },
      summary: { en: "A practical scope for faster handover and budget-conscious delivery.", ar: "نطاق عملي لتسليم أسرع وتكلفة أكثر انضباطًا." },
      features: [
        { id: "pkg-basic-f1", text: { en: "Electrical works", ar: "أعمال الكهرباء" } },
        { id: "pkg-basic-f2", text: { en: "Plumbing", ar: "السباكة" } },
        { id: "pkg-basic-f3", text: { en: "Base paint", ar: "الدهانات الأساسية" } },
        { id: "pkg-basic-f4", text: { en: "Organized handover", ar: "تسليم منظم" } },
      ],
    },
  },
  {
    id: "pkg-super",
    name: "Super Lux",
    pricePerMeter: 3600,
    summary: "The balanced package for elevated design, better materials, and controlled cost.",
    features: ["Modern flooring", "Decorative lighting", "Premium materials", "Engineering supervision"],
    featured: true,
    content: {
      name: { en: "Super Lux", ar: "سوبر لوكس" },
      summary: { en: "The balanced package for elevated design, better materials, and controlled cost.", ar: "الباقة المتوازنة لتصميم أرقى وخامات أفضل وتكلفة أكثر تحكمًا." },
      features: [
        { id: "pkg-super-f1", text: { en: "Modern flooring", ar: "أرضيات حديثة" } },
        { id: "pkg-super-f2", text: { en: "Decorative lighting", ar: "إضاءة ديكورية" } },
        { id: "pkg-super-f3", text: { en: "Premium materials", ar: "خامات مميزة" } },
        { id: "pkg-super-f4", text: { en: "Engineering supervision", ar: "إشراف هندسي" } },
      ],
    },
  },
  {
    id: "pkg-ultra",
    name: "Ultra Super Lux",
    pricePerMeter: 5200,
    summary: "A high-end finishing route with custom detailing and smart-home readiness.",
    features: ["Custom design", "Luxury materials", "Tailored details", "Smart-ready setup"],
    content: {
      name: { en: "Ultra Super Lux", ar: "ألترا سوبر لوكس" },
      summary: { en: "A high-end finishing route with custom detailing and smart-home readiness.", ar: "مسار تشطيب عالي المستوى بتفاصيل خاصة واستعداد للمنزل الذكي." },
      features: [
        { id: "pkg-ultra-f1", text: { en: "Custom design", ar: "تصميم مخصص" } },
        { id: "pkg-ultra-f2", text: { en: "Luxury materials", ar: "خامات فاخرة" } },
        { id: "pkg-ultra-f3", text: { en: "Tailored details", ar: "تفاصيل خاصة" } },
        { id: "pkg-ultra-f4", text: { en: "Smart-ready setup", ar: "تجهيز للمنزل الذكي" } },
      ],
    },
  },
];

export const smartDevices: SmartDevice[] = [
  {
    id: "dev-lock",
    name: "Smart Lock",
    summary: "A secure access layer with phone-based management and flexible permissions.",
    benefits: ["Fingerprint entry", "Remote unlock", "Temporary access codes"],
    content: {
      name: { en: "Smart Lock", ar: "قفل ذكي" },
      summary: { en: "A secure access layer with phone-based management and flexible permissions.", ar: "طبقة وصول آمنة مع إدارة عبر الهاتف وصلاحيات مرنة." },
      benefits: [
        { id: "dev-lock-b1", text: { en: "Fingerprint entry", ar: "دخول بالبصمة" } },
        { id: "dev-lock-b2", text: { en: "Remote unlock", ar: "فتح عن بعد" } },
        { id: "dev-lock-b3", text: { en: "Temporary access codes", ar: "أكواد دخول مؤقتة" } },
      ],
    },
  },
  {
    id: "dev-camera",
    name: "Smart Cameras",
    summary: "Always-on monitoring with mobile alerts and better visibility around the home.",
    benefits: ["24/7 monitoring", "Motion alerts", "Night vision"],
    content: {
      name: { en: "Smart Cameras", ar: "كاميرات ذكية" },
      summary: { en: "Always-on monitoring with mobile alerts and better visibility around the home.", ar: "مراقبة مستمرة مع تنبيهات على الهاتف ورؤية أفضل حول المنزل." },
      benefits: [
        { id: "dev-camera-b1", text: { en: "24/7 monitoring", ar: "مراقبة 24/7" } },
        { id: "dev-camera-b2", text: { en: "Motion alerts", ar: "تنبيهات حركة" } },
        { id: "dev-camera-b3", text: { en: "Night vision", ar: "رؤية ليلية" } },
      ],
    },
  },
  {
    id: "dev-lighting",
    name: "Smart Lighting",
    summary: "Automated lighting scenes that improve comfort while reducing energy waste.",
    benefits: ["Scheduling", "Remote control", "Energy saving"],
    content: {
      name: { en: "Smart Lighting", ar: "إضاءة ذكية" },
      summary: { en: "Automated lighting scenes that improve comfort while reducing energy waste.", ar: "مشاهد إضاءة مؤتمتة تحسن الراحة وتقلل استهلاك الطاقة." },
      benefits: [
        { id: "dev-lighting-b1", text: { en: "Scheduling", ar: "جدولة" } },
        { id: "dev-lighting-b2", text: { en: "Remote control", ar: "تحكم عن بعد" } },
        { id: "dev-lighting-b3", text: { en: "Energy saving", ar: "توفير الطاقة" } },
      ],
    },
  },
  {
    id: "dev-curtains",
    name: "Smart Curtains",
    summary: "Smooth curtain control integrated with scenes, schedules, and voice routines.",
    benefits: ["Voice ready", "Scene integration", "Remote control"],
    content: {
      name: { en: "Smart Curtains", ar: "ستائر ذكية" },
      summary: { en: "Smooth curtain control integrated with scenes, schedules, and voice routines.", ar: "تحكم سلس في الستائر مرتبط بالمشاهد والجداول والأوامر الصوتية." },
      benefits: [
        { id: "dev-curtains-b1", text: { en: "Voice ready", ar: "جاهز للأوامر الصوتية" } },
        { id: "dev-curtains-b2", text: { en: "Scene integration", ar: "ربط بالمشاهد" } },
        { id: "dev-curtains-b3", text: { en: "Remote control", ar: "تحكم عن بعد" } },
      ],
    },
  },
];

export const smartPackages: SmartPackage[] = [
  {
    id: "smart-starter",
    name: "Starter Package",
    summary: "A practical entry package for apartments and compact units.",
    devices: ["Smart switch", "Smart camera", "Smart doorbell"],
    content: {
      name: { en: "Starter Package", ar: "باقة البداية" },
      summary: { en: "A practical entry package for apartments and compact units.", ar: "باقة عملية كبداية للشقق والوحدات الصغيرة." },
      devices: [
        { id: "smart-starter-d1", text: { en: "Smart switch", ar: "مفتاح ذكي" } },
        { id: "smart-starter-d2", text: { en: "Smart camera", ar: "كاميرا ذكية" } },
        { id: "smart-starter-d3", text: { en: "Smart doorbell", ar: "جرس ذكي" } },
      ],
    },
  },
  {
    id: "smart-security",
    name: "Security Package",
    summary: "A bundle centered on protection, monitoring, and controlled access.",
    devices: ["Smart lock", "Cameras", "Sensors"],
    content: {
      name: { en: "Security Package", ar: "باقة الأمان" },
      summary: { en: "A bundle centered on protection, monitoring, and controlled access.", ar: "باقة تركز على الحماية والمراقبة والتحكم في الوصول." },
      devices: [
        { id: "smart-security-d1", text: { en: "Smart lock", ar: "قفل ذكي" } },
        { id: "smart-security-d2", text: { en: "Cameras", ar: "كاميرات" } },
        { id: "smart-security-d3", text: { en: "Sensors", ar: "حساسات" } },
      ],
    },
  },
  {
    id: "smart-full",
    name: "Full Smart Home",
    summary: "Lighting, curtains, AC control, and access in one connected experience.",
    devices: ["Lighting", "Curtains", "AC control", "Locks"],
    content: {
      name: { en: "Full Smart Home", ar: "منزل ذكي كامل" },
      summary: { en: "Lighting, curtains, AC control, and access in one connected experience.", ar: "الإضاءة والستائر والتحكم في التكييف والوصول داخل تجربة متصلة واحدة." },
      devices: [
        { id: "smart-full-d1", text: { en: "Lighting", ar: "إضاءة" } },
        { id: "smart-full-d2", text: { en: "Curtains", ar: "ستائر" } },
        { id: "smart-full-d3", text: { en: "AC control", ar: "تحكم في التكييف" } },
        { id: "smart-full-d4", text: { en: "Locks", ar: "أقفال" } },
      ],
    },
  },
];

export const initialLeads: Lead[] = [
  {
    id: "lead-1",
    fullName: "Mohamed Adel",
    phone: "+20 101 123 4567",
    email: "m.adel@example.com",
    service: "Project Visit",
    message: "Interested in booking a visit for AL HAMD TOWER next week.",
    createdAt: "2026-04-03T11:00:00.000Z",
    status: "new",
    stage: "site_visit",
    priority: "high",
    assignedTo: "usr-mariam",
    source: "Website",
    budget: 3200000,
  },
  {
    id: "lead-2",
    fullName: "Sara Wael",
    phone: "+20 109 555 7788",
    service: "Finishing Quote",
    message: "Looking for a Super Lux estimate for a 140 m² apartment.",
    createdAt: "2026-04-03T12:15:00.000Z",
    status: "contacted",
    stage: "qualified",
    priority: "medium",
    assignedTo: "usr-karim",
    source: "WhatsApp",
    budget: 520000,
  },
  {
    id: "lead-3",
    fullName: "Nour Hassan",
    phone: "+20 111 700 8899",
    email: "nour@example.com",
    service: "Smart Home Setup",
    message: "Wants security package with cameras and smart lock.",
    createdAt: "2026-04-04T08:40:00.000Z",
    status: "new",
    stage: "new",
    priority: "medium",
    assignedTo: "usr-omar",
    source: "Landing Page",
    budget: 95000,
  },
];

export const initialLeadActivities: LeadActivity[] = [
  {
    id: "act-1",
    leadId: "lead-1",
    kind: "stage_change",
    body: "Lead moved to site visit after qualification call.",
    createdAt: "2026-04-03T14:30:00.000Z",
    createdBy: "Mariam Saleh",
  },
  {
    id: "act-2",
    leadId: "lead-2",
    kind: "note",
    body: "Requested revised estimate including smart-prep add-on.",
    createdAt: "2026-04-03T16:00:00.000Z",
    createdBy: "Karim Adel",
  },
];

export const teamUsers: TeamUser[] = [
  {
    id: "usr-owner",
    email: "owner@veyra.com",
    fullName: "Veyra Owner",
    role: "owner",
    permissions: getRolePermissions("owner"),
    accessMode: "role",
    status: "active",
    lastSeenAt: "2026-04-04T08:00:00.000Z",
  },
  {
    id: "usr-mariam",
    email: "mariam@veyra.com",
    fullName: "Mariam Saleh",
    role: "sales",
    permissions: getRolePermissions("sales"),
    accessMode: "role",
    status: "active",
    invitedAt: "2026-03-24T09:00:00.000Z",
    lastSeenAt: "2026-04-04T07:20:00.000Z",
  },
  {
    id: "usr-karim",
    email: "karim@veyra.com",
    fullName: "Karim Adel",
    role: "admin",
    permissions: getRolePermissions("admin"),
    accessMode: "role",
    status: "active",
    invitedAt: "2026-03-21T09:00:00.000Z",
    lastSeenAt: "2026-04-03T18:45:00.000Z",
  },
  {
    id: "usr-omar",
    email: "omar@veyra.com",
    fullName: "Omar Nabil",
    role: "sales",
    permissions: getRolePermissions("sales"),
    accessMode: "role",
    status: "active",
    invitedAt: "2026-03-26T09:00:00.000Z",
    lastSeenAt: "2026-04-03T13:10:00.000Z",
  },
];

export const userInvitations: UserInvitation[] = [
  {
    id: "inv-1",
    email: "content@veyra.com",
    role: "editor",
    permissions: getRolePermissions("editor"),
    accessMode: "role",
    status: "pending",
    invitedBy: "owner@veyra.com",
    createdAt: "2026-04-02T10:00:00.000Z",
    lastSentAt: "2026-04-02T10:00:00.000Z",
  },
  {
    id: "inv-2",
    email: "marketing@veyra.com",
    role: "marketer",
    permissions: getRolePermissions("marketer"),
    accessMode: "role",
    status: "pending",
    invitedBy: "owner@veyra.com",
    createdAt: "2026-04-03T09:00:00.000Z",
    lastSentAt: "2026-04-03T09:00:00.000Z",
  },
];

export const crmSnapshot: CrmSnapshot = {
  stageCounts: {
    new: 1,
    contacted: 0,
    qualified: 1,
    site_visit: 1,
    negotiation: 0,
    closed_won: 0,
    closed_lost: 0,
  },
  totalLeads: initialLeads.length,
  pendingInvites: userInvitations.filter((invite) => invite.status === "pending").length,
  activeUsers: teamUsers.filter((user) => user.status === "active").length,
};
