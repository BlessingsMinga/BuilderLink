import { Redirect, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { useAuthStore } from '@/features/authentication/store/auth-store';
import type { UserRole } from '@/shared/types';

type ProtectedProps = {
  /** Require an active session before rendering children. Defaults to true. */
  requireAuth?: boolean;
  /** When provided, the session must hold one of these roles. */
  roles?: UserRole[];
  /** Where to send unauthenticated users. */
  redirectTo?: Href;
  /** Where to send authenticated users who lack an allowed role. */
  unauthorizedTo?: Href;
  children: ReactNode;
};

/**
 * Declarative route guard for expo-router.
 * Renders <Redirect /> when the session does not satisfy the requirements,
 * otherwise renders the wrapped children.
 */
export function Protected({
  requireAuth = true,
  roles,
  redirectTo = '/login',
  unauthorizedTo = '/(tabs)',
  children,
}: ProtectedProps) {
  const session = useAuthStore((state) => state.session);

  if (requireAuth && !session) {
    return <Redirect href={redirectTo} />;
  }

  // requireAuth=false still treats a roles check as needing authentication.
  if (session && roles && roles.length > 0 && !roles.includes(session.role)) {
    return <Redirect href={unauthorizedTo} />;
  }

  if (!session && roles && roles.length > 0) {
    return <Redirect href={redirectTo} />;
  }

  return <>{children}</>;
}