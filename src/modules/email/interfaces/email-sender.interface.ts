import type { EmailAdapter } from '../schemas';

/**
 * Defines the contract for email delivery services.
 */
export interface EmailSender {
  /**
   * Sends an email with the provided HTML content.
   *
   * @param {EmailAdapter} data Email payload.
   * @returns A promise that resolves once the email is sent.
   */
  send(data: EmailAdapter): Promise<void>;
}
