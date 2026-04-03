export interface UsersE2EUserCredentials {
  email: string;
  userName: string;
  password: string;
  id?: string;
  accessToken?: string;
}

export interface UsersE2EContext {
  createdUserIds: string[];
  adminUser: UsersE2EUserCredentials;
  regularUser: UsersE2EUserCredentials;
  managedUserId?: string;
}
