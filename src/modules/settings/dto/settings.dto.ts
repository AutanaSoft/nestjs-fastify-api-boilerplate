import { createZodDto } from 'nestjs-zod';
import { EmailSettingsResponseSchema, UpdateEmailSettingsSchema } from '../schemas/settings.schema';

/**
 * Input DTO to update email settings.
 */
export class UpdateEmailSettingsDto extends createZodDto(UpdateEmailSettingsSchema) {}

/**
 * Output DTO for email settings.
 */
export class EmailSettingsResponseDto extends createZodDto(EmailSettingsResponseSchema) {}
