export const navFields = [
  ["home", "Home link"],
  ["projects", "Projects link"],
  ["finishing", "Finishing link"],
  ["smartHome", "Smart home link"],
  ["book", "Book visit link"],
  ["cta", "Header CTA"],
] as const;

export const footerFields = [
  ["tagline", "Footer tagline", "textarea", 3],
  ["copyright", "Footer copyright", "input", 2],
] as const;

export const heroFields = [
  ["chip", "Hero chip", "input", 2],
  ["title", "Hero title", "textarea", 3],
  ["description", "Hero description", "textarea", 4],
  ["primaryCta", "Hero primary CTA", "input", 2],
  ["secondaryCta", "Hero secondary CTA", "input", 2],
] as const;

export const leadFields = [
  ["title", "Form title", "input", 2],
  ["description", "Form description", "textarea", 3],
  ["fullNameLabel", "Full name label", "input", 2],
  ["fullNamePlaceholder", "Full name placeholder", "input", 2],
  ["phoneLabel", "Phone label", "input", 2],
  ["phonePlaceholder", "Phone placeholder", "input", 2],
  ["emailLabel", "Email label", "input", 2],
  ["emailPlaceholder", "Email placeholder", "input", 2],
  ["serviceLabel", "Service label", "input", 2],
  ["projectVisitOption", "Project visit option", "input", 2],
  ["finishingQuoteOption", "Finishing quote option", "input", 2],
  ["smartHomeSetupOption", "Smart-home option", "input", 2],
  ["messageLabel", "Message label", "input", 2],
  ["messagePlaceholder", "Message placeholder", "textarea", 3],
  ["submitLabel", "Submit label", "input", 2],
  ["sendingLabel", "Sending state", "input", 2],
  ["successMessage", "Success message", "textarea", 3],
] as const;

export const installmentFields = [
  ["eyebrow", "Section eyebrow", "input", 2],
  ["title", "Section title", "textarea", 3],
  ["description", "Section description", "textarea", 4],
  ["unitTypeLabel", "Unit type label", "input", 2],
  ["areaLabel", "Area label", "input", 2],
  ["yearsLabel", "Years label", "input", 2],
  ["downPaymentLabel", "Down payment label", "input", 2],
  ["cashPriceLabel", "Cash price label", "input", 2],
  ["installmentPriceLabel", "Installment price label", "input", 2],
  ["monthlyPaymentLabel", "Monthly payment label", "input", 2],
] as const;

export const finishingCalculatorFields = [
  ["eyebrow", "Section eyebrow", "input", 2],
  ["title", "Section title", "textarea", 3],
  ["description", "Section description", "textarea", 4],
  ["areaLabel", "Area label", "input", 2],
  ["tierLabel", "Tier label", "input", 2],
  ["addOnsLabel", "Add-ons label", "input", 2],
  ["estimatedCostLabel", "Estimated cost label", "input", 2],
  ["estimatedNote", "Estimated note", "textarea", 3],
] as const;

export const homeFields = [
  ["serviceArchitectureEyebrow", "Service architecture eyebrow", "input", 2],
  ["serviceArchitectureTitle", "Service architecture title", "textarea", 3],
  ["serviceArchitectureDescription", "Service architecture description", "textarea", 4],
  ["featuredEyebrow", "Featured projects eyebrow", "input", 2],
  ["featuredTitle", "Featured projects title", "textarea", 3],
  ["featuredDescription", "Featured projects description", "textarea", 4],
  ["serviceModulesEyebrow", "Service modules eyebrow", "input", 2],
  ["serviceModulesTitle", "Service modules title", "textarea", 3],
  ["serviceModulesDescription", "Service modules description", "textarea", 4],
  ["leadEyebrow", "Lead block eyebrow", "input", 2],
  ["leadTitle", "Lead block title", "textarea", 3],
  ["leadDescription", "Lead block description", "textarea", 4],
  ["signatureLaunch", "Dashboard tag", "input", 2],
  ["primeInventory", "Dashboard inventory chip", "input", 2],
  ["unitTypesLabel", "Unit types label", "input", 2],
  ["investmentFlow", "Investment flow label", "input", 2],
  ["platformMode", "Platform mode label", "input", 2],
  ["separateAdmin", "Separate admin label", "input", 2],
  ["intentEyebrow", "Intent eyebrow", "input", 2],
  ["intentTitle", "Intent title", "textarea", 3],
  ["intentDescription", "Intent description", "textarea", 4],
  ["trustTitle", "Trust title", "textarea", 3],
  ["bookingTitle", "Booking title", "input", 2],
] as const;

export const basicPageFields = [
  ["eyebrow", "Section eyebrow", "input", 2],
  ["title", "Section title", "textarea", 3],
  ["description", "Section description", "textarea", 4],
] as const;

export const projectsPageFields = [
  ...basicPageFields,
  ["from", "From label", "input", 2],
  ["installmentsUpTo", "Installments label", "input", 2],
  ["years", "Years label", "input", 2],
  ["unitsListed", "Units listed label", "input", 2],
  ["viewProject", "View project CTA", "input", 2],
  ["compareTitle", "Compare title", "textarea", 3],
  ["compareLabel", "Compare label", "input", 2],
  ["bookVisit", "Book visit CTA", "input", 2],
  ["visitReasonTitle", "Visit reason title", "textarea", 3],
  ["curatedInventoryLabel", "Inventory stat label", "input", 2],
  ["curatedInventoryNote", "Inventory stat note", "textarea", 3],
  ["locationsLabel", "Locations stat label", "input", 2],
  ["locationsNote", "Locations stat note", "textarea", 3],
  ["installmentStatLabel", "Installment stat label", "input", 2],
  ["installmentStatNote", "Installment stat note", "textarea", 3],
  ["flagshipLabel", "Flagship badge", "input", 2],
  ["launchModeLabel", "Launch mode label", "input", 2],
  ["featuredMode", "Featured mode value", "input", 2],
  ["coreMode", "Core mode value", "input", 2],
] as const;

export const finishingPageFields = [
  ...basicPageFields,
  ["recommended", "Recommended tag", "input", 2],
  ["package", "Package tag", "input", 2],
  ["beforeAfterAlt", "Before/after image alt", "input", 2],
  ["whyTitle", "Why title", "textarea", 3],
  ["processTitle", "Process title", "textarea", 3],
  ["faqTitle", "FAQ title", "textarea", 3],
  ["stickyPrimary", "Mobile primary CTA", "input", 2],
  ["stickySecondary", "Mobile secondary CTA", "input", 2],
] as const;

export const smartHomeFields = [
  ...basicPageFields,
  ["howItWorks", "How it works label", "input", 2],
  ["whyTitle", "Why title", "textarea", 3],
  ["useCaseTitle", "Use case title", "textarea", 3],
  ["faqTitle", "FAQ title", "textarea", 3],
  ["stickyPrimary", "Mobile primary CTA", "input", 2],
  ["stickySecondary", "Mobile secondary CTA", "input", 2],
] as const;

export const projectDetailFields = [
  ["projectHighlights", "Project highlights title", "input", 2],
  ["bookVisit", "Book visit CTA", "input", 2],
  ["availableUnits", "Available units title", "input", 2],
  ["residentialLabel", "Residential label", "input", 2],
  ["administrativeLabel", "Administrative label", "input", 2],
  ["penthouseLabel", "Penthouse label", "input", 2],
  ["floor", "Floor label", "input", 2],
  ["bedrooms", "Bedrooms label", "input", 2],
  ["officeReady", "Office ready label", "input", 2],
  ["requestVisit", "Request visit title", "input", 2],
  ["requestDescription", "Request visit description", "textarea", 3],
  ["upTo", "Up to label", "input", 2],
  ["years", "Years label", "input", 2],
  ["sqm", "Square meter label", "input", 2],
  ["available", "Available status", "input", 2],
  ["reserved", "Reserved status", "input", 2],
  ["perSqm", "Per sqm label", "input", 2],
  ["visitNow", "Visit now CTA", "input", 2],
  ["viewInventory", "View inventory CTA", "input", 2],
  ["whyTitle", "Why title", "textarea", 3],
  ["whyDescription", "Why description", "textarea", 4],
  ["fitTitle", "Fit title", "textarea", 3],
  ["processTitle", "Process title", "textarea", 3],
  ["faqTitle", "FAQ title", "textarea", 3],
  ["responseTitle", "Response title", "input", 2],
  ["responseText", "Response text", "textarea", 3],
  ["urgencyTitle", "Urgency title", "input", 2],
  ["urgencyText", "Urgency text", "textarea", 3],
  ["stickyPrimary", "Sticky primary CTA", "input", 2],
  ["stickySecondary", "Sticky secondary CTA", "input", 2],
] as const;
