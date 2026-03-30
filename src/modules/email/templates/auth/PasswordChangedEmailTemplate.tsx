import { Preview, Section, Text } from '@react-email/components';
import { BaseLayoutComponent } from '../components';

/**
 * Password changed email template props.
 */
interface PasswordChangedEmailProps {
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
  'Has recibido este correo electrónico porque se ha realizado un cambio de contraseña en tu cuenta de AutanaSoft.';

/**
 * Password changed email preview text.
 */
const previewText = 'Tu contraseña ha sido cambiada con éxito';

/**
 * Password changed notification email template.
 *
 * @param {PasswordChangedEmailProps} props Template properties.
 * @returns {React.ReactNode} Email template component.
 */
export const PasswordChangedEmailTemplate = ({
  name,
  changedAt,
}: PasswordChangedEmailProps): React.ReactNode => (
  <BaseLayoutComponent name={name} footerDisclaimer={disclaimer}>
    <Preview>{previewText}</Preview>
    <Section>
      <Text className="text-sm leading-[24px]">
        Te informamos que la contraseña de tu cuenta en <strong>AutanaSoft</strong> ha sido
        actualizada correctamente.
      </Text>
      <Section className="bg-gray-50 rounded-lg p-4 my-4">
        <Text className="text-sm m-0">
          <strong>Fecha y hora del cambio:</strong> {changedAt}
        </Text>
      </Section>
      <Text className="text-sm leading-[24px]">
        Si tú realizaste este cambio, no es necesario que realices ninguna acción adicional.
      </Text>
      <Text className="text-sm leading-[24px] font-bold text-red-600 mt-4">
        Si NO solicitaste este cambio, por favor ponte en contacto con nuestro equipo de soporte de
        inmediato para proteger tu cuenta.
      </Text>
    </Section>
  </BaseLayoutComponent>
);

/**
 * Preview props for the password changed email template.
 */
PasswordChangedEmailTemplate.PreviewProps = {
  name: 'Usuario de Prueba',
  changedAt: new Date().toLocaleString(),
} as PasswordChangedEmailProps;

export default PasswordChangedEmailTemplate;
