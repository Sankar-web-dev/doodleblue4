import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import type { UserModel, RoleModel } from '../generated/prisma/models.js';
import { ApiException } from '../common/api-error.js';
import { AuthService } from './auth.service.js';

export interface AuthenticatedRequest extends Request {
  user: UserModel;
  currentRole: RoleModel | null;
  /** The raw Bearer token presented with this request. */
  accessToken: string;
}

/**
 * JWT Bearer authentication. Reads the `Authorization: Bearer <token>`
 * header, verifies the token and attaches `req.user` + `req.currentRole`
 * for downstream guards and handlers.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();

    const header = request.headers.authorization;
    const token = header?.startsWith('Bearer ')
      ? header.slice('Bearer '.length).trim()
      : undefined;

    if (!token) {
      throw new ApiException(
        401,
        'UNAUTHENTICATED',
        'Please log in to continue',
      );
    }

    const user = await this.auth.resolveTokenUser(token);

    request.user = user;
    request.currentRole = user.roleRef ?? null;
    request.accessToken = token;

    return true;
  }
}
