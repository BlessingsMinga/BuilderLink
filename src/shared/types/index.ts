export type UserRole = 'customer' | 'builder' | 'administrator';
export type AuthSession = { userId: string; role: UserRole; email: string } | null;
