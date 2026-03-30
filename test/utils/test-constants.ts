/**
 * Shared payload for valid settings update requests.
 */
export const validSettingsPayload = {
  activeProvider: 'smtp' as const,
  defaultFrom: 'no-reply@example.com',
  smtp: {
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    user: 'smtp-user',
    pass: 'smtp-pass',
  },
};

/**
 * Shared base payload for users create requests.
 * Email and userName should be suffixed per test to keep uniqueness.
 */
export const createUserPayloadBase = {
  email: 'e2e-user@example.com',
  password: 'Password123!',
  userName: 'e2e-user',
};
