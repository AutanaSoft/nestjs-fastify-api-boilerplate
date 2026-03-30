import { z } from 'zod';

export const EmailSettingsSchema = z.object({
  activeProvider: z.enum(['smtp', 'resend']).default('smtp'),
  defaultFrom: z.string().email(),
  smtp: z
    .object({
      host: z.string().min(1),
      port: z.number().int().positive(),
      user: z.string().min(1),
      pass: z.string().min(1),
      secure: z.boolean(),
    })
    .optional(),
  resend: z
    .object({
      apiKey: z.string().min(1),
    })
    .optional(),
});

/** Schema to validate saving or updating settings via HTTP */
export const UpdateEmailSettingsSchema = EmailSettingsSchema;

/** Response schema for the Controller (Allows returning masked passwords) */
export const EmailSettingsResponseSchema = EmailSettingsSchema;

export type EmailSettingsConfig = z.infer<typeof EmailSettingsSchema>;
