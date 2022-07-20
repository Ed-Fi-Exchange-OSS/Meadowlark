export function determineAuthStrategyFromRoles(rolesList: string[]): string {
  if (rolesList.find((role) => role.toLocaleLowerCase() === 'host')) {
    return 'FULL_ACCESS';
  }
  if (rolesList.find((role) => role.toLocaleLowerCase() === 'vendor')) {
    return 'OWNERSHIP_BASED';
  }
  return '';
}
