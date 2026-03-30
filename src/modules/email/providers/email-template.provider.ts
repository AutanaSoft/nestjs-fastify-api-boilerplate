import { Injectable } from '@nestjs/common';
import { render } from '@react-email/render';
import { ReactElement } from 'react';

/**
 * Renders React-based email templates to HTML.
 */
@Injectable()
export class EmailTemplateProvider {
  /**
   * Renders a React email template into an HTML string.
   *
   * @param template React email template element.
   * @returns Promise resolved with generated HTML.
   */
  async render(template: ReactElement): Promise<string> {
    return render(template);
  }
}
