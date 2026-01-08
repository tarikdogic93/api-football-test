import { z } from "zod";

const naturalNumberString = (fieldName: string) =>
  z
    .string()
    .trim()
    .optional()
    .superRefine((value, ctx) => {
      if (!value) return;

      if (!/^[1-9]\d*$/.test(value)) {
        ctx.addIssue({
          code: "custom",
          message: `${fieldName} must be a natural number`,
        });
      }
    });

export const searchTeamsSchema = z
  .object({
    id: naturalNumberString("ID"),
    name: z.string().trim().optional(),
    league: naturalNumberString("League ID"),
    season: z
      .string()
      .trim()
      .optional()
      .superRefine((value, ctx) => {
        if (!value) return;

        if (!/^\d{4}$/.test(value)) {
          ctx.addIssue({
            code: "custom",
            message: "Season must be a 4-digit year (YYYY)",
          });
          return;
        }

        const year = Number(value);
        if (year < 2022 || year > 2024) {
          ctx.addIssue({
            code: "custom",
            message: "Free plans only support seasons from 2022 to 2024",
          });
        }
      }),
    country: z.string().trim().optional(),
    code: z
      .string()
      .trim()
      .optional()
      .superRefine((value, ctx) => {
        if (!value) return;

        if (value.length !== 3) {
          ctx.addIssue({
            code: "custom",
            message: "Code must be exactly 3 characters",
          });
        }
      }),
    venue: naturalNumberString("Venue ID"),
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
    const fields = [
      "id",
      "name",
      "league",
      "season",
      "country",
      "code",
      "venue",
      "search",
    ];

    const hasValue = fields.some(
      (key) => data[key as keyof typeof data] !== ""
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

    if (data.league && !data.season) {
      ctx.addIssue({
        code: "custom",
        message: "Season is required when league is provided",
        path: ["season"],
      });
    }

    if (data.season && !data.league) {
      ctx.addIssue({
        code: "custom",
        message: "League is required when season is provided",
        path: ["league"],
      });
    }

    if (data.search && data.league) {
      ctx.addIssue({
        code: "custom",
        message: "Cannot use league with search",
        path: ["league"],
      });
    }

    if (data.search && data.season) {
      ctx.addIssue({
        code: "custom",
        message: "Cannot use season with search",
        path: ["season"],
      });
    }
  });
