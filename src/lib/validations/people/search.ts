import { z } from "zod";

export const searchPeopleQuerySchema = z.object({
  search: z
    .string()
    .min(1, "Informe um termo de busca.")
    .max(100, "Busca muito longa."),
});

export type SearchPeopleQuery = z.infer<typeof searchPeopleQuerySchema>;
