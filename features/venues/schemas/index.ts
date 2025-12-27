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

    const idField = nonEmptyFields.find((field) => field.key === "id");
    if (idField) {
      const idValue = idField.value!.trim();
      if (!/^[1-9]\d*$/.test(idValue)) {
        ctx.addIssue({
          code: "custom",
          message: "ID must be a natural number",
          path: ["id"],
        });
      }
    }

    const searchField = nonEmptyFields.find((field) => field.key === "search");
    if (searchField) {
      const searchValue = searchField.value!.trim();

      if (searchValue.length < 3) {
        ctx.addIssue({
          code: "custom",
          message: "Search must be at least 3 characters",
          path: ["search"],
        });
      }

      if (!/^[a-zA-Z0-9 ]+$/.test(searchValue)) {
        ctx.addIssue({
          code: "custom",
          message:
            "Search can only include standard letters, numbers, and spaces (no accents or symbols)",
          path: ["search"],
        });
      }
    }
  });
