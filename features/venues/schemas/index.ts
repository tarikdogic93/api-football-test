import { z } from "zod";

export const searchVenuesSchema = z
  .object({
    id: z.string().trim().optional(),
    name: z.string().trim().optional(),
    city: z.string().trim().optional(),
    country: z.string().trim().optional(),
    search: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    const nonEmptyFields = [
      { key: "id", value: data.id },
      { key: "name", value: data.name },
      { key: "city", value: data.city },
      { key: "country", value: data.country },
      { key: "search", value: data.search },
    ].filter((field) => field.value !== undefined && field.value.trim() !== "");

    if (nonEmptyFields.length > 1) {
      nonEmptyFields.forEach((field) => {
        ctx.addIssue({
          code: "custom",
          message: "Only one search parameter can be provided at a time",
          path: [field.key],
        });
      });
    }

    if (nonEmptyFields.length === 1 && nonEmptyFields[0].key === "search") {
      const value = nonEmptyFields[0].value!.trim();
      if (value.length < 3) {
        ctx.addIssue({
          code: "custom",
          message: "Search must be at least 3 characters",
          path: ["search"],
        });
      }
    }
  });
