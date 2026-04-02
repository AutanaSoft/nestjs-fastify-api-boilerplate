export const UserStatus = {
  REGISTERED: 'REGISTERED',
  ACTIVE: 'ACTIVE',
  BANNED: 'BANNED',
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  PAYMENT_FROZEN: 'PAYMENT_FROZEN',
  FROZEN: 'FROZEN',
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const UserRoles = {
  ADMIN: 'ADMIN',
  USER: 'USER',
  GUEST: 'GUEST',
} as const;

export type UserRoles = (typeof UserRoles)[keyof typeof UserRoles];
