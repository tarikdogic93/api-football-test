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

    const nameField = nonEmptyFields.find((field) => field.key === "name");
    if (nameField) {
      const nameValue = nameField.value!.trim();
      if (!/^[a-zA-Z0-9 ]+$/.test(nameValue)) {
        ctx.addIssue({
          code: "custom",
          message:
            "Name can only include standard letters, numbers, and spaces (no accents or symbols)",
          path: ["name"],
        });
      }
    }

    const codeField = nonEmptyFields.find((field) => field.key === "code");
    if (codeField) {
      const codeValue = codeField.value!.trim();

      if (codeValue.length < 2 || codeValue.length > 6) {
        ctx.addIssue({
          code: "custom",
          message: "Code must be between 2 and 6 characters",
          path: ["code"],
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
