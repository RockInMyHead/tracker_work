import { useAuth } from '../services/auth';

export type UserRole = 'manager' | 'employee';

export const useRole = (): UserRole => {
  const { user } = useAuth();

  if (!user) {
    return 'employee'; // Default role
  }

  // Check if user is in manager group
  if (user.groups && user.groups.includes('manager')) {
    return 'manager';
  }

  // Default to employee
  return 'employee';
};

export const useIsManager = (): boolean => {
  const role = useRole();
  return role === 'manager';
};

export const useIsEmployee = (): boolean => {
  const role = useRole();
  return role === 'employee';
};
