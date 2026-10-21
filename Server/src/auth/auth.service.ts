import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import type { UserModel, RoleModel } from '../generated/prisma/models.js';
import { ApiException } from '../common/api-error.js';
import { Permission, SYSTEM_ROLE } from '../common/constants.js';

export type UserWithRole = UserModel & { roleRef?: RoleModel | null };

/** Claims embedded in the signed JWT. */
export interface JwtPayload {
  /** User id */
  sub: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /** Build the safe user payload including the role's permission matrix. */
  async safeUser(user: UserWithRole) {
    let permissions: Permission[] = [];

    if (user.role !== SYSTEM_ROLE && user.roleId) {
      const role =
        user.roleRef ??
        (await this.prisma.role.findUnique({ where: { id: user.roleId } }));
      permissions = (role?.permissions as Permission[] | null) ?? [];
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      roleId: user.roleId ?? undefined,
      image: user.image ?? undefined,
      mustChangePassword: user.mustChangePassword,
      isActive: user.isActive,
      permissions,
    };
  }

  /** Sign a JWT access token for the user (returned in the response body). */
  async issueToken(user: Pick<UserModel, 'id' | 'role'>): Promise<string> {
    const payload: JwtPayload = { sub: user.id, role: user.role };
    return this.jwt.signAsync(payload);
  }

  /**
   * Verify a JWT's signature + expiry and load the user (with role) it
   * belongs to. The DB lookup keeps `isActive` revocation and role-matrix
   * changes live — a deactivated user is rejected even with a valid token.
   */
  async resolveTokenUser(token: string): Promise<UserWithRole> {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token);
    } catch (error) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw new ApiException(
          401,
          'TOKEN_EXPIRED',
          'Your session has expired. Please log in again',
        );
      }
      throw new ApiException(
        401,
        'TOKEN_INVALID',
        'Your session is invalid. Please log in again',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { roleRef: true },
    });

    if (!user || !user.isActive) {
      throw new ApiException(
        401,
        'TOKEN_INVALID',
        'Your session is invalid. Please log in again',
      );
    }

    return user;
  }
}
