export const RESOURCES = ['roles', 'users'] as const;
export type Resource = (typeof RESOURCES)[number];

export const ACTIONS = ['create', 'read', 'update', 'delete'] as const;
export type Action = (typeof ACTIONS)[number];

export interface Permission {
  resource: Resource | string;
  actions: Action[] | string[];
}

export const SYSTEM_ROLE = 'SUPER_ADMIN';
