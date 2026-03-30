import type { TailwindConfig, TailwindProps } from '@react-email/components';
import { pixelBasedPreset, Tailwind } from '@react-email/components';

/**
 * Tailwind CSS configuration optimized for email templates.
 * Includes pixel-based presets and brand color tokens.
 */
const config: TailwindConfig = {
  presets: [pixelBasedPreset],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#2563eb',
          secondary: '#1e40af',
          accent: '#1e3a8a',
          success: '#16a34a',
          warning: '#f59e0b',
          error: '#ef4444',
        },
      },
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          '"Noto Sans"',
          'sans-serif',
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
          '"Noto Color Emoji"',
        ],
      },
    },
  },
};

/**
 * Wrapper component that applies Tailwind CSS styles to children.
 * Uses a predefined configuration with brand colors and fonts.
 *
 * @param props Component properties with child nodes.
 * @returns React Email Tailwind component with configured styles.
 */
export const TailwindWrapperComponent = ({ children }: TailwindProps) => {
  return <Tailwind config={config}>{children}</Tailwind>;
};

export default TailwindWrapperComponent;
