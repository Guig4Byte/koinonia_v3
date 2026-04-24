import { z } from "zod";

export const createInteractionSchema = z.object({
  personId: z.string().cuid("ID de pessoa inválido."),
  kind: z.enum(["call", "whatsapp", "visit", "prayer", "note"], {
    message: "Tipo de interação inválido.",
  }),
  content: z
    .string()
    .min(1, "Informe o conteúdo da anotação.")
    .max(2000, "Anotação muito longa."),
});

export type CreateInteractionInput = z.infer<typeof createInteractionSchema>;
