/**
 * Central brand tokens for Kitchen's Worth.
 * Sourced from the client-supplied logo. Use these anywhere a raw hex
 * would otherwise be hard-coded (email templates, PDFs, canvas).
 */
export const brand = {
  name: "Kitchen's Worth",
  nameShort: "KW",
  tagline: "...eat well & spend less.",
  colors: {
    black: "#0B0B0B",
    ink: "#141414",
    green: "#5CD15C",
    greenDark: "#3FA23F",
    yellow: "#F5D74A",
    cream: "#FAFAF7",
  },
  contact: {
    phone: "+234 703 060 6021",
    whatsappDisplay: "07030606021",
    whatsappIntl: "2347030606021",
    email: "hello@kitchensworth.ng",
    instagram: "Kitchensworth.ng",
    instagramUrl: "https://instagram.com/Kitchensworth.ng",
  },
  city: {
    primary: "Abuja",
    copy: "Proudly serving Abuja, expanding across Nigeria",
  },
} as const;

export const NAV_LINKS = [
  { href: "/menu", label: "Menu" },
  { href: "/party-packs", label: "Party Packs" },
  { href: "/bulk", label: "Bulk" },
  { href: "/catering", label: "Catering" },
  { href: "/zones", label: "Delivery" },
  { href: "/track", label: "Track Order" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;
