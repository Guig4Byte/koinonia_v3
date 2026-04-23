import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .min(1, "Informe seu email.")
  .email("Informe um email valido.")
  .transform((value) => value.toLowerCase());

const passwordSchema = z
  .string()
  .min(8, "A senha precisa ter pelo menos 8 caracteres.")
  .max(72, "A senha informada e muito longa.");

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token obrigatorio."),
});

export const onboardingSchema = z.object({
  churchName: z
    .string()
    .trim()
    .min(3, "Informe o nome da igreja.")
    .max(120, "Use um nome de igreja mais curto."),
  pastorName: z
    .string()
    .trim()
    .min(3, "Informe o nome do pastor.")
    .max(120, "Use um nome mais curto."),
  email: emailSchema,
  password: passwordSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
