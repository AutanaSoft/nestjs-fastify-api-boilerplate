import { Preview, Section, Text } from '@react-email/components';
import { BaseLayoutComponent } from '../components';

/**
 * Welcome email template props.
 */
interface EmailWelcomeProps {
  name: string;
}

/**
 * Welcome email disclaimer text.
 */
const disclaimer =
  'You are receiving this email because an account was created with this email address.';

/**
 * Welcome email preview text.
 */
const previewText = "Your account is ready. Let's get started.";

/**
 * Welcome email template.
 *
 * @param {EmailWelcomeProps} props Template properties.
 * @returns {React.ReactNode} Email template component.
 */
export const EmailWelcomeTemplate = ({ name }: EmailWelcomeProps): React.ReactNode => (
  <BaseLayoutComponent name={name} footerDisclaimer={disclaimer}>
    {/* Body */}
    <Preview>{previewText}</Preview>
    <Section>
      <Text className="text-sm leading-[24px]">
        Welcome. Your account has been created successfully, and you can now start using the
        platform.
      </Text>
      <Text className="text-sm leading-[24px]">
        We built this platform to help teams move faster, stay organized, and scale with confidence.
      </Text>
      <Text className="text-sm leading-[24px]">
        If you need help getting started, our support team is here for you.
      </Text>
      <Text className="text-xs leading-[24px] text-gray-500 italic mt-4">
        If this was not you, please ignore this message or contact support.
      </Text>
    </Section>
  </BaseLayoutComponent>
);

/**
 * Preview props for the welcome email template.
 */
EmailWelcomeTemplate.PreviewProps = {
  name: 'Platform User',
} as EmailWelcomeProps;

export default EmailWelcomeTemplate;
