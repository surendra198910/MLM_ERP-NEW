// src/utils/dateFormatter.ts

export type DateFormatType =
  | "short"
  | "readable"
  | "withTime"
  | "iso";

export const formatDate = (
  value: string | Date | null | undefined,
  format: DateFormatType = "readable"
): string => {
  if (!value) return "-";

  const date = new Date(value);
  if (isNaN(date.getTime())) return "-";

  switch (format) {
    case "short":
      return date.toLocaleDateString("en-GB");

    case "readable":
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

    case "withTime":
      return date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

    case "iso":
      return date.toISOString().split("T")[0];

    default:
      return date.toLocaleDateString();
  }
};
