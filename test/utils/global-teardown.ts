import { closeAppInstance } from './test-client';

/**
 * Global Teardown para Jest.
 * Se ejecuta una única vez al finalizar todas las pruebas del proyecto.
 */
export default async function globalTeardown() {
  await closeAppInstance();
}
