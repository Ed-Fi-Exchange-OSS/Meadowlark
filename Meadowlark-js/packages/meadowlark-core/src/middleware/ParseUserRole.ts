import { AuthorizationStrategy } from '../security/AuthorizationStrategy';

export function determineAuthStrategyFromRoles(rolesList: string[]): AuthorizationStrategy {
  if (rolesList.some((role) => role.toLocaleLowerCase() === 'host')) {
    return { type: 'FULL_ACCESS' };
  }

  if (rolesList.some((role) => role.toLocaleLowerCase() === 'admin')) {
    return { type: 'FULL_ACCESS' };
  }

  if (rolesList.some((role) => role.toLocaleLowerCase() === 'vendor' || role.toLocaleLowerCase() === 'assessment')) {
    return { type: 'OWNERSHIP_BASED' };
  }

  return { type: 'UNDEFINED' };
}
