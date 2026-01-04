import { z } from "zod";

export const searchCountriesSchema = z.object({
  name: z.string().trim().optional(),
  code: z
    .string()
    .trim()
    .optional()
    .superRefine((value, ctx) => {
      if (!value) return;

      if (value.length < 2 || value.length > 6) {
        ctx.addIssue({
          code: "custom",
          message: "Code must be between 2 and 6 characters",
        });
      }
    }),
  search: z
    .string()
    .trim()
    .optional()
    .superRefine((value, ctx) => {
      if (!value) return;

      if (value.length < 3) {
        ctx.addIssue({
          code: "custom",
          message: "Search must be at least 3 characters",
        });
      }

      if (!/^[a-zA-Z0-9 ]+$/.test(value)) {
        ctx.addIssue({
          code: "custom",
          message:
            "Search can only include standard letters, numbers, and spaces (no accents or symbols)",
        });
      }
    }),
});
