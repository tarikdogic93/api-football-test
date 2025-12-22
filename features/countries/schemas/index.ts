import { z } from "zod";

export const searchCountriesSchema = z
  .object({
    name: z.string().trim().optional(),
    code: z.string().trim().optional(),
    search: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    const nonEmptyFields = [
      { key: "name", value: data.name },
      { key: "code", value: data.code },
      { key: "search", value: data.search },
    ].filter((field) => field.value !== undefined && field.value.trim() !== "");

    if (nonEmptyFields.length > 1) {
      nonEmptyFields.forEach((field) => {
        ctx.addIssue({
          code: "custom",
          message: "Only one of name, code, or search can be provided",
          path: [field.key],
        });
      });
    }

    if (nonEmptyFields.length === 1) {
      const filledField = nonEmptyFields[0];
      const value = filledField.value!.trim();

      if (filledField.key === "search" && value.length < 3) {
        ctx.addIssue({
          code: "custom",
          message: "Search must be at least 3 characters",
          path: ["search"],
        });
      }

      if (
        filledField.key === "code" &&
        (value.length < 2 || value.length > 6)
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Code must be between 2 and 6 characters",
          path: ["code"],
        });
      }
    }
  });
