import { Preview, Section, Text } from '@react-email/components';
import { BaseLayoutComponent } from '../components';

/**
 * Welcome email template props.
 */
interface WelcomeEmailProps {
  name: string;
}

/**
 * Welcome email disclaimer text.
 */
const disclaimer = 'Has recibido este correo electrónico porque te has registrado en AutanaSoft.';

/**
 * Welcome email preview text.
 */
const previewText = 'Bienvenido a AutanaSoft';

/**
 * Welcome email template.
 *
 * @param {WelcomeEmailProps} props Template properties.
 * @returns {React.ReactNode} Email template component.
 */
export const WelcomeEmailTemplate = ({ name }: WelcomeEmailProps): React.ReactNode => (
  <BaseLayoutComponent name={name} footerDisclaimer={disclaimer}>
    {/* Body */}
    <Preview>{previewText}</Preview>
    <Section>
      <Text className="text-sm leading-[24px]">
        ¡Es un gusto saludarte! Estamos muy emocionados de que hayas decidido unirte a la familia de{' '}
        <strong>AutanaSoft</strong>.
      </Text>
      <Text className="text-sm leading-[24px]">
        Nuestra misión es proporcionarte herramientas potentes y escalables para que puedas
        enfocarte en lo que realmente importa: hacer crecer tus proyectos. Tu cuenta ha sido
        configurada con éxito y ya tienes acceso total a nuestra plataforma.
      </Text>
      <Text className="text-sm leading-[24px]">
        Si tienes alguna duda o necesitas ayuda para comenzar, nuestro equipo de soporte está a solo
        un clic de distancia. ¡Estamos aquí para apoyarte en cada paso del camino!
      </Text>
      <Text className="text-xs leading-[24px] text-gray-500 italic mt-4">
        Si no te has registrado en nuestro sitio, puedes ignorar este mensaje de forma segura.
      </Text>
    </Section>
  </BaseLayoutComponent>
);

/**
 * Preview props for the welcome email template.
 */
WelcomeEmailTemplate.PreviewProps = {
  name: 'AutanaSoft',
} as WelcomeEmailProps;

export default WelcomeEmailTemplate;
