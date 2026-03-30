/**
 * Injection token for the email sender provider.
 */
export const EMAIL_SENDER = Symbol('EMAIL_SENDER');

/**
 * Injection token for the SMTP adapter provider.
 */
export const SMTP_EMAIL_ADAPTER = Symbol('SMTP_EMAIL_ADAPTER');

/**
 * Injection token for the Resend adapter provider.
 */
export const RESEND_EMAIL_ADAPTER = Symbol('RESEND_EMAIL_ADAPTER');
