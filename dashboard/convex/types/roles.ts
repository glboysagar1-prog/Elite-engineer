/**
 * Role and Compatibility Types
 */

export type RoleType = 
  | 'backend'
  | 'frontend'
  | 'fullstack'
  | 'devops'
  | 'mobile'
  | 'data-engineer'
  | 'security'
  | 'ml-engineer'
  | 'sre'
  | 'platform-engineer';

export interface RoleQuery {
  role: RoleType;
  requiredTechnologies?: string[]; // Optional hints, but not required
  preferredExperience?: string[]; // Optional hints
}
