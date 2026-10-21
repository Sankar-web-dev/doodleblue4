import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiException } from '../common/api-error.js';
import {
  PERMISSION_KEY,
  type RequiredPermission,
} from './permissions.decorator.js';
import type { AuthenticatedRequest } from './auth.guard.js';
import { Permission, SYSTEM_ROLE } from '../common/constants.js';
import type { RoleModel, UserModel } from '../generated/prisma/models.js';
import type { Action, Resource } from '../common/constants.js';

/**
 * Permission-based authorization — must run after AuthGuard.
 * SUPER_ADMIN bypasses all permission checks; everyone else needs the
 * resource:action in their role's permission matrix.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<RequiredPermission>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();

    if (
      !hasPermission(
        request.user,
        request.currentRole,
        required.resource,
        required.action,
      )
    ) {
      throw new ApiException(
        403,
        'FORBIDDEN',
        `Missing permission: ${required.resource}:${required.action}`,
      );
    }

    return true;
  }
}

/** Non-guard permission check for service/controller-level decisions. */
export function hasPermission(
  user: UserModel | undefined,
  role: RoleModel | null | undefined,
  resource: Resource,
  action: Action,
): boolean {
  if (!user) return false;
  if (user.role === SYSTEM_ROLE) return true;

  const permissions = (role?.permissions as Permission[] | null) ?? [];
  const perm = permissions.find((p) => p.resource === resource);
  return perm?.actions.includes(action) ?? false;
}
