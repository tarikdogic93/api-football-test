import { z } from "zod";

export const searchVenuesSchema = z
  .object({
    id: z
      .string()
      .trim()
      .optional()
      .superRefine((value, ctx) => {
        if (!value) return;

        if (!/^[1-9]\d*$/.test(value)) {
          ctx.addIssue({
            code: "custom",
            message: "ID must be a natural number",
          });
        }
      }),
    name: z.string().trim().optional(),
    city: z.string().trim().optional(),
    country: z.string().trim().optional(),
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
  })
  .superRefine((data, ctx) => {
    const fields = ["id", "name", "city", "country", "search"];
    const hasValue = fields.some(
      (key) => data[key as keyof typeof data]?.trim() !== ""
    );

    if (!hasValue) {
      fields.forEach((key) => {
        ctx.addIssue({
          code: "custom",
          message: "At least one query parameter must be provided",
          path: [key],
        });
      });
    }
  });
