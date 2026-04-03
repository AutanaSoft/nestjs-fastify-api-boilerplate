import { Preview, Section, Text } from '@react-email/components';
import { BaseLayoutComponent } from '../components';

/**
 * Password changed email template props.
 */
interface EmailPasswordChangedProps {
  /**
   * Recipient name.
   */
  name: string;
  /**
   * Date and time when the password was changed.
   */
  changedAt: string;
}

/**
 * Password changed email disclaimer text.
 */
const disclaimer =
  'You are receiving this email because a password change was completed for your account.';

/**
 * Password changed email preview text.
 */
const previewText = 'Your password was changed successfully.';

/**
 * Password changed notification email template.
 *
 * @param {EmailPasswordChangedProps} props Template properties.
 * @returns {React.ReactNode} Email template component.
 */
export const EmailPasswordChangedTemplate = ({
  name,
  changedAt,
}: EmailPasswordChangedProps): React.ReactNode => (
  <BaseLayoutComponent name={name} footerDisclaimer={disclaimer}>
    <Preview>{previewText}</Preview>
    <Section>
      <Text className="text-sm leading-[24px]">
        This is a confirmation that your account password was updated successfully.
      </Text>
      <Section className="bg-gray-50 rounded-lg p-4 my-4">
        <Text className="text-sm m-0">
          <strong>Change date and time:</strong> {changedAt}
        </Text>
      </Section>
      <Text className="text-sm leading-[24px]">
        If you made this change, no further action is required.
      </Text>
      <Text className="text-sm leading-[24px] font-bold text-red-600 mt-4">
        If you did not request this change, contact support immediately to secure your account.
      </Text>
    </Section>
  </BaseLayoutComponent>
);

/**
 * Preview props for the password changed email template.
 */
EmailPasswordChangedTemplate.PreviewProps = {
  name: 'Platform User',
  changedAt: new Date().toLocaleString(),
} as EmailPasswordChangedProps;

export default EmailPasswordChangedTemplate;
