import { z } from "zod";

export const eventIdParamsSchema = z.object({
  id: z.string().cuid("ID de evento inválido."),
});

export const registerAttendanceSchema = z.object({
  attendances: z
    .array(
      z.object({
        personId: z.string().cuid("ID de pessoa inválido."),
        present: z.boolean(),
      }),
    )
    .min(1, "Informe pelo menos uma presença."),
});

export type EventIdParams = z.infer<typeof eventIdParamsSchema>;
export type RegisterAttendanceInput = z.infer<typeof registerAttendanceSchema>;
