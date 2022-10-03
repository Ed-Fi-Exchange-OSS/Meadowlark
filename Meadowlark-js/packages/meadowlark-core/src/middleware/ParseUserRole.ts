import { AuthorizationStrategy } from '../security/AuthorizationStrategy';

export function determineAuthStrategyFromRoles(rolesList: string[]): AuthorizationStrategy {
  const withAssessment = rolesList.some((role) => role.toLocaleLowerCase() === 'assessment');

  if (rolesList.some((role) => role.toLocaleLowerCase() === 'host')) {
    return { type: 'FULL_ACCESS', withAssessment };
  }

  if (rolesList.some((role) => role.toLocaleLowerCase() === 'admin')) {
    return { type: 'FULL_ACCESS', withAssessment };
  }

  if (rolesList.some((role) => role.toLocaleLowerCase() === 'vendor')) {
    return { type: 'OWNERSHIP_BASED', withAssessment };
  }

  return { type: 'UNDEFINED', withAssessment };
}
