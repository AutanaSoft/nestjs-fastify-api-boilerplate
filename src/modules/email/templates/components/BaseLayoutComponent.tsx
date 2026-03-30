import { Body, Container, Font, Head, Hr, Html, Img, Section, Text } from '@react-email/components';
import * as React from 'react';
import { TailwindWrapperComponent } from './TailwindWrapperComponent';

interface BaseLayoutProps {
  name: string;
  children: React.ReactNode;
  footerDisclaimer?: string;
}

const fullYear = new Date().getFullYear();

/**
 * Base layout component shared by all AutanaSoft email templates.
 * Encapsulates common structure such as header, greeting, and footer.
 */
export const BaseLayoutComponent = ({ children, name, footerDisclaimer }: BaseLayoutProps) => (
  <TailwindWrapperComponent>
    <Html>
      <Head>
        <Font
          fontFamily="Plus Jakarta Sans"
          fallbackFontFamily="sans-serif"
          webFont={{
            url: 'https://fonts.gstatic.com/s/plusjakartasans/v12/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_qU7NSg.ttf',
            format: 'truetype',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
        <Font
          fontFamily="Plus Jakarta Sans"
          fallbackFontFamily="sans-serif"
          webFont={{
            url: 'https://fonts.gstatic.com/s/plusjakartasans/v12/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_d0nNSg.ttf',
            format: 'truetype',
          }}
          fontWeight={600}
          fontStyle="normal"
        />
      </Head>
      <Body className="bg-white">
        <Container className="mt-6 px-10 mx-auto bg-white rounded-lg border border-solid border-gray-300 overflow-hidden">
          {/* Header */}
          <Section className="pt-2">
            <Img
              className="mx-auto"
              src={`https://www.autanasoft.com//assets/img/logos/autanasoft.png`}
              height="64"
              alt="Autana Soft"
            />
          </Section>

          <Section>
            <Hr className="border-gray-300 my-5" />
            <Text className="text-sm leading-[22px] font-semibold">Hola {name},</Text>
          </Section>

          {/* Page Content */}
          {children}

          {/* Footer Signature */}
          <Section className="pb-6">
            <Hr className="border-gray-300 my-5" />
            <Text className="text-sm leading-[22px] m-0">Gracias,</Text>
            <Text className="text-md font-semibold leading-[22px] m-0">
              El equipo de AutanaSoft
            </Text>
          </Section>
        </Container>
        <Container className="px-10 text-center text-gray-500">
          {/* Rights and Disclaimer */}
          <Section className="py-6">
            {footerDisclaimer && (
              <Text className="text-xs leading-[22px] m-0">{footerDisclaimer}</Text>
            )}
            <Text className="text-xs leading-[22px] m-0">
              © {fullYear} AutanaSoft. Todos los derechos reservados.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  </TailwindWrapperComponent>
);

BaseLayoutComponent.PreviewProps = {
  name: 'AutanaSoft User',
  footerDisclaimer: 'This is a disclaimer for testing purposes.',
} as BaseLayoutProps;

export default BaseLayoutComponent;
