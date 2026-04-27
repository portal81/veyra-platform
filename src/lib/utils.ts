import clsx, { type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(value);
}


export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export const formatNumberList = (values: number[]) => values.join(", ");
export const parseNumberList = (raw: string) => {
  return raw
    .split(",")
    .map((v) => Number(v.trim()))
    .filter((v) => !isNaN(v));
};

export const defaultText = (seed = ""): import("@/lib/types").LocalizedText => ({ en: seed, ar: "", color: "#ffffff" });
export const makeLocalizedItem = (seed = "New item"): import("@/lib/types").LocalizedListItem => ({
  id: `item-${crypto.randomUUID()}`,
  text: defaultText(seed),
});

