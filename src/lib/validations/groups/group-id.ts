import { z } from "zod";

export const groupIdParamsSchema = z.object({
  id: z.string().cuid("ID de célula inválido."),
});

export type GroupIdParams = z.infer<typeof groupIdParamsSchema>;
