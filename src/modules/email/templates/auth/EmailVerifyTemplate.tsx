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
  'Has recibido este correo electrónico porque has solicitado confirmar tu correo electrónico en AutanaSoft.';

/**
 * Verification email preview text.
 */
const previewText = 'Confirma tu correo electrónico para completar el registro en AutanaSoft.';

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
        Para finalizar la configuración de tu cuenta y empezar a utilizar{' '}
        <strong>AutanaSoft</strong>, necesitamos verificar tu dirección de correo electrónico.
      </Text>
      <Text className="text-sm leading-[24px]">
        Por favor, haz clic en el siguiente botón para confirmar tu registro:
      </Text>
    </Section>

    <Section className="text-center mt-[20px] mb-[20px]">
      <Button
        className="bg-brand-primary rounded-[8px] text-white text-[14px] font-semibold no-underline text-center px-6 py-3"
        href={href}
      >
        Confirmar mi correo electrónico
      </Button>
    </Section>

    <Section>
      <Text className="text-xs leading-[24px] text-gray-500">
        Si el botón de arriba no funciona, copia y pega este enlace en tu navegador:
        <br />
        <a href={href} className="text-brand-primary break-all">
          {href}
        </a>
      </Text>
      <Hr className="border-gray-200 mt-4 mb-4" />
      <Text className="text-xs leading-[24px] text-gray-500 italic">
        Si no has solicitado este registro, no es necesario que realices ninguna acción; puedes
        ignorar este mensaje con total tranquilidad.
      </Text>
    </Section>
  </BaseLayoutComponent>
);

/**
 * Preview props for the verification email template.
 */
EmailVerifyTemplate.PreviewProps = {
  name: 'AutanaSoft',
  href: 'https://autanasoft.com/auth/verify-email?token=1234567890',
} as EmailVerifyProps;

export default EmailVerifyTemplate;
