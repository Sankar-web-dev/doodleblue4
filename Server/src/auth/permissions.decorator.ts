import { SetMetadata } from '@nestjs/common';
import type { Action, Resource } from '../common/constants.js';

export const PERMISSION_KEY = 'required_permission';

export interface RequiredPermission {
  resource: Resource;
  action: Action;
}

export const RequirePermission = (resource: Resource, action: Action) =>
  SetMetadata(PERMISSION_KEY, { resource, action } as RequiredPermission);
