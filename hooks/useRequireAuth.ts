import { useCallback } from 'react';
import { useAuthStore } from '../store/authStore';

/**
 * Returns a guard function that either runs the action immediately
 * (if signed in) or opens the AuthGate sheet and queues the action
 * for after sign-in.
 *
 * Usage:
 *   const requireAuth = useRequireAuth();
 *   requireAuth(() => bookRide(quote));
 */
export function useRequireAuth() {
  const user = useAuthStore((s) => s.user);
  const openAuthSheet = useAuthStore((s) => s.openAuthSheet);

  return useCallback(
    (action: () => void) => {
      if (user) {
        action();
      } else {
        openAuthSheet(action);
      }
    },
    [user, openAuthSheet],
  );
}
