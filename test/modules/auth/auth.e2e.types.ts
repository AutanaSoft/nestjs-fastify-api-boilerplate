export interface AuthSessionE2E {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUserCredentialsE2E {
  email: string;
  userName: string;
  password: string;
  id?: string;
}

export interface AuthE2EContext {
  createdUserIds: string[];
  primaryUser: AuthUserCredentialsE2E;
  bannedUser: AuthUserCredentialsE2E;
  activeSession?: AuthSessionE2E;
}
