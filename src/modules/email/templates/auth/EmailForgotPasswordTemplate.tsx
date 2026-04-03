import { Button, Hr, Preview, Section, Text } from '@react-email/components';
import BaseLayoutComponent from '../components/BaseLayoutComponent';

/**
 * Forgot password email template props.
 */
interface EmailForgotPasswordProps {
  name: string;
  href: string;
}

/**
 * Forgot password email disclaimer text.
 */
const disclaimer =
  'You are receiving this email because a password reset was requested for this account.';

/**
 * Forgot password email preview text.
 */
const previewText = 'Reset your password to recover access to your account.';

/**
 * Password recovery email template.
 *
 * @param {EmailForgotPasswordProps} props Template properties.
 * @returns {React.ReactNode} Email template component.
 */
export const EmailForgotPasswordTemplate = ({
  name,
  href,
}: EmailForgotPasswordProps): React.ReactNode => (
  <BaseLayoutComponent name={name} footerDisclaimer={disclaimer}>
    {/* Body */}
    <Preview>{previewText}</Preview>
    <Section>
      <Text className="text-sm leading-[24px]">
        We received a request to reset the password for the account associated with this email
        address.
      </Text>
      <Text className="text-sm leading-[24px]">
        To continue and create a new password, click the button below:
      </Text>
    </Section>

    <Section className="text-center mt-[20px] mb-[20px]">
      <Button
        className="bg-brand-primary rounded-[8px] text-white text-[14px] font-semibold no-underline text-center px-6 py-3"
        href={href}
      >
        Reset My Password
      </Button>
    </Section>

    <Section>
      <Text className="text-xs leading-[24px] text-gray-500">
        This link will expire soon for security reasons. If the button above does not work, copy and
        paste this URL into your browser:
        <br />
        <a href={href} className="text-brand-primary break-all">
          {href}
        </a>
      </Text>
      <Hr className="border-gray-200 mt-4 mb-4" />
      <Text className="text-xs leading-[24px] text-gray-500 italic">
        <strong>Important:</strong> If you did not request this change, you can safely ignore this
        message. Your current password will remain unchanged.
      </Text>
    </Section>
  </BaseLayoutComponent>
);

EmailForgotPasswordTemplate.PreviewProps = {
  name: 'Platform User',
  href: 'https://app.example.com/auth/reset-password?token=1234567890',
} as EmailForgotPasswordProps;

export default EmailForgotPasswordTemplate;
