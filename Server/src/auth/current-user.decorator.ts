import {
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import type { UserModel, RoleModel } from '../generated/prisma/models.js';
import type { AuthenticatedRequest } from './auth.guard.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserModel => {
    return ctx.switchToHttp().getRequest<AuthenticatedRequest>().user;
  },
);

export const CurrentRole = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RoleModel | null => {
    return ctx.switchToHttp().getRequest<AuthenticatedRequest>()
      .currentRole;
  },
);
