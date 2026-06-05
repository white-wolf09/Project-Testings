export const CATEGORIES = [
  {
    id: "Plumber",
    label: "Plumber",
    icon: "🚿",
    color: "#0EA5E9",
    bg: "#F0F9FF",
    subCategories: [
      "Pipe Installation",
      "Leakage Fixing",
      "Tap / Faucet Repair",
      "Bathroom Fitting",
      "Water Tank Cleaning",
      "Sewerage / Drainage Issue",
    ],
  },
  {
    id: "Electrician",
    label: "Electrician",
    icon: "⚡",
    color: "#F59E0B",
    bg: "#FFFBEB",
    subCategories: [
      "Wiring Installation",
      "Switch / Socket Repair",
      "Fan Installation",
      "Light Fitting (LED, Bulbs)",
      "Circuit Breaker Fixing",
      "Power Failure Troubleshooting",
    ],
  },
  {
    id: "AC Repair",
    label: "AC Repair",
    icon: "❄️",
    color: "#06B6D4",
    bg: "#ECFEFF",
    subCategories: [
      "AC Installation",
      "AC Servicing / Cleaning",
      "Gas Refilling",
      "Cooling Issue Fixing",
      "AC Dismantling / Shifting",
    ],
  },
  {
    id: "Cleaning",
    label: "Cleaning",
    icon: "🧹",
    color: "#10B981",
    bg: "#ECFDF5",
    subCategories: [
      "Home Cleaning",
      "Deep Cleaning",
      "Sofa / Carpet Cleaning",
      "Kitchen Cleaning",
      "Bathroom Cleaning",
      "Office Cleaning",
    ],
  },
  {
    id: "Carpenter",
    label: "Carpenter",
    icon: "🪚",
    color: "#92400E",
    bg: "#FEF3C7",
    subCategories: [
      "Furniture Repair",
      "Door / Window Fixing",
      "Cabinet Making",
      "Wood Polishing",
      "Bed / Table Assembly",
    ],
  },
  {
    id: "Electronics",
    label: "Electronics",
    icon: "🔌",
    color: "#6366F1",
    bg: "#EEF2FF",
    subCategories: [
      "Mobile Repair",
      "Laptop Repair",
      "TV Repair",
      "Appliance Repair",
      "Router / CCTV Setup",
    ],
  },
  {
    id: "Other",
    label: "Other",
    icon: "🔄",
    color: "#64748B",
    bg: "#F1F5F9",
    subCategories: [
      "Painter",
      "Mechanic",
      "Pest Control",
      "Movers & Packers",
      "Handyman Services",
    ],
  },
];

export const getCategoryMeta = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];

export const ALL_SUBCATEGORIES = CATEGORIES.flatMap((c) =>
  c.subCategories.map((s) => ({ label: s, category: c.id, icon: c.icon, color: c.color }))
);