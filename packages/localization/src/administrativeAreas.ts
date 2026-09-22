/**
 * Bangladesh's 8 divisions, with bn/en labels, for the case-report
 * administrative-area field (PRD section 8.2). District and upazila
 * level data is deliberately not included here - the PRD (section 30,
 * future dependencies) itself lists the full administrative-boundary
 * dataset as a later addition, and the MVP pilot is a single
 * constrained Dhaka area (AGENTS.md Limitations).
 */
export interface AdministrativeDivision {
  id: string;
  en: string;
  bn: string;
}

export const administrativeDivisions: readonly AdministrativeDivision[] = [
  { id: "barishal", en: "Barishal", bn: "বরিশাল" },
  { id: "chattogram", en: "Chattogram", bn: "চট্টগ্রাম" },
  { id: "dhaka", en: "Dhaka", bn: "ঢাকা" },
  { id: "khulna", en: "Khulna", bn: "খুলনা" },
  { id: "mymensingh", en: "Mymensingh", bn: "ময়মনসিংহ" },
  { id: "rajshahi", en: "Rajshahi", bn: "রাজশাহী" },
  { id: "rangpur", en: "Rangpur", bn: "রংপুর" },
  { id: "sylhet", en: "Sylhet", bn: "সিলেট" },
] as const;
