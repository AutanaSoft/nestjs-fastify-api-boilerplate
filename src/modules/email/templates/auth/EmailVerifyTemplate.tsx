import { Button, Hr, Preview, Section, Text } from '@react-email/components';

import BaseLayoutComponent from '../components/BaseLayoutComponent';

/**
 * Verification email template props.
 */
interface EmailVerifyProps {
  name: string;
  href: string;
}

/**
 * Verification email disclaimer text.
 */
const disclaimer =
  'You are receiving this email because a request was made to verify this email address.';

/**
 * Verification email preview text.
 */
const previewText = 'Please verify your email address to complete your registration.';

/**
 * Account verification email template.
 *
 * @param {EmailVerifyProps} props Template properties.
 * @returns {React.Node} Email template component.
 */
export const EmailVerifyTemplate = ({ name, href }: EmailVerifyProps): React.ReactNode => (
  <BaseLayoutComponent name={name} footerDisclaimer={disclaimer}>
    {/* Body */}
    <Preview>{previewText}</Preview>
    <Section>
      <Text className="text-sm leading-[24px]">
        To complete your account setup, we need to verify your email address.
      </Text>
      <Text className="text-sm leading-[24px]">
        Please click the button below to confirm your registration:
      </Text>
    </Section>

    <Section className="text-center mt-[20px] mb-[20px]">
      <Button
        className="bg-brand-primary rounded-[8px] text-white text-[14px] font-semibold no-underline text-center px-6 py-3"
        href={href}
      >
        Verify My Email
      </Button>
    </Section>

    <Section>
      <Text className="text-xs leading-[24px] text-gray-500">
        If the button above does not work, copy and paste this link into your browser:
        <br />
        <a href={href} className="text-brand-primary break-all">
          {href}
        </a>
      </Text>
      <Hr className="border-gray-200 mt-4 mb-4" />
      <Text className="text-xs leading-[24px] text-gray-500 italic">
        If you did not request this, you can safely ignore this message.
      </Text>
    </Section>
  </BaseLayoutComponent>
);

/**
 * Preview props for the verification email template.
 */
EmailVerifyTemplate.PreviewProps = {
  name: 'Platform User',
  href: 'https://app.example.com/auth/verify-email?token=1234567890',
} as EmailVerifyProps;

export default EmailVerifyTemplate;
