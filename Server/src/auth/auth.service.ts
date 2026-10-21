import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import type { UserModel } from '../generated/prisma/models.js';
import { ApiException } from '../common/api-error.js';

export type UserWithRole = UserModel;

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

  /** Build the safe user payload (no password hash). */
  async safeUser(user: UserModel) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image ?? undefined,
      mustChangePassword: user.mustChangePassword,
      isActive: user.isActive,
    };
  }

  /** Sign a JWT access token for the user (returned in the response body). */
  async issueToken(user: Pick<UserModel, 'id' | 'role'>): Promise<string> {
    const payload: JwtPayload = { sub: user.id, role: user.role };
    return this.jwt.signAsync(payload);
  }

  /**
   * Verify a JWT's signature + expiry and load the user it belongs to.
   * The DB lookup keeps `isActive` revocation live — a deactivated user is
   * rejected even with a valid token.
   */
  async resolveTokenUser(token: string): Promise<UserModel> {
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
