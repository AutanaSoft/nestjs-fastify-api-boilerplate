export const AUTH_TOKEN_PURPOSES = {
  VERIFY_EMAIL: 'verify-email',
  RESET_PASSWORD: 'reset-password',
} as const;

const TTL_PATTERN = /^(\d+)([smhd])$/;

/**
 * Converts a compact ttl expression (e.g., 15m, 7d) into milliseconds.
 */
export const parseDurationToMs = (ttl: string): number => {
  const parsed = TTL_PATTERN.exec(ttl);

  if (!parsed) {
    throw new Error(`Invalid TTL format: ${ttl}`);
  }

  const amount = Number(parsed[1]);
  const unit = parsed[2];

  if (unit === 's') return amount * 1_000;
  if (unit === 'm') return amount * 60_000;
  if (unit === 'h') return amount * 3_600_000;

  return amount * 86_400_000;
};
