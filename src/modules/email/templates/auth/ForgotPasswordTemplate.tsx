import { Button, Hr, Preview, Section, Text } from '@react-email/components';
import BaseLayoutComponent from '../components/BaseLayoutComponent';

/**
 * Forgot password email template props.
 */
interface ForgotPasswordProps {
  name: string;
  href: string;
}

/**
 * Forgot password email disclaimer text.
 */
const disclaimer =
  'Has recibido este correo electrónico porque has solicitado restablecer tu contraseña en AutanaSoft.';

/**
 * Forgot password email preview text.
 */
const previewText = 'Restablece tu contraseña en AutanaSoft para recuperar el acceso a tu cuenta.';

/**
 * Password recovery email template.
 *
 * @param {ForgotPasswordProps} props Template properties.
 * @returns {React.ReactNode} Email template component.
 */
export const ForgotPasswordTemplate = ({ name, href }: ForgotPasswordProps): React.ReactNode => (
  <BaseLayoutComponent name={name} footerDisclaimer={disclaimer}>
    {/* Body */}
    <Preview>{previewText}</Preview>
    <Section>
      <Text className="text-sm leading-[24px]">
        Hemos recibido una solicitud para restablecer la contraseña de tu cuenta asociada a este
        correo electrónico en <strong>AutanaSoft</strong>.
      </Text>
      <Text className="text-sm leading-[24px]">
        Para continuar con el proceso y crear una nueva contraseña, por favor haz clic en el
        siguiente botón:
      </Text>
    </Section>

    <Section className="text-center mt-[20px] mb-[20px]">
      <Button
        className="bg-brand-primary rounded-[8px] text-white text-[14px] font-semibold no-underline text-center px-6 py-3"
        href={href}
      >
        Restablecer mi contraseña
      </Button>
    </Section>

    <Section>
      <Text className="text-xs leading-[24px] text-gray-500">
        Este enlace caducará pronto por motivos de seguridad. Si el botón de arriba no funciona,
        puedes copiar y pegar esta dirección en tu navegador:
        <br />
        <a href={href} className="text-brand-primary break-all">
          {href}
        </a>
      </Text>
      <Hr className="border-gray-200 mt-4 mb-4" />
      <Text className="text-xs leading-[24px] text-gray-500 italic">
        <strong>Importante:</strong> Si tú no has solicitado este cambio, puedes ignorar este
        mensaje con total seguridad; tu contraseña actual permanecerá intacta y nadie más podrá
        cambiarla sin acceso a este correo.
      </Text>
    </Section>
  </BaseLayoutComponent>
);

ForgotPasswordTemplate.PreviewProps = {
  name: 'AutanaSoft',
  href: 'https://autanasoft.com/auth/reset-password?token=1234567890',
} as ForgotPasswordProps;

export default ForgotPasswordTemplate;
