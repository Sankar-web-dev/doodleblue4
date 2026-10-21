import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ApiException } from '../common/api-error.js';
import { listMeta, pageParams } from '../common/pagination.js';
import type { RoleModel } from '../generated/prisma/models.js';
import type {
  CreateRoleDto,
  ListRolesQueryDto,
  UpdateRoleDto,
} from './dto.js';

function toResponse(role: RoleModel) {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    permissions: role.permissions,
    isSystem: role.isSystem,
    isActive: role.isActive,
    createdBy: role.createdById ?? undefined,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
}

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  // ── createRole ────────────────────────────────────────────────────────────

  async createRole(input: CreateRoleDto, createdBy: string) {
    const taken = await this.prisma.role.findFirst({
      where: { name: { equals: input.name, mode: 'insensitive' } },
      select: { id: true },
    });
    if (taken) {
      throw new ApiException(
        409,
        'ROLE_NAME_IN_USE',
        'A role with this name already exists',
      );
    }

    const role = await this.prisma.role.create({
      data: {
        name: input.name,
        description: input.description ?? '',
        permissions: input.permissions as unknown as Prisma.InputJsonValue,
        isSystem: false,
        isActive: true,
        createdById: createdBy,
      },
    });

    return toResponse(role);
  }

  // ── listRoles ─────────────────────────────────────────────────────────────

  async listRoles(query: ListRolesQueryDto) {
    const { page, limit, search, isActive } = query;

    const where: Record<string, unknown> = {};
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const { skip, take } = pageParams(query);
    const [total, docs] = await Promise.all([
      this.prisma.role.count({ where }),
      this.prisma.role.findMany({
        where,
        orderBy: [{ isSystem: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take,
      }),
    ]);

    return { data: docs.map(toResponse), meta: listMeta(total, page, limit) };
  }

  // ── getRoleById ───────────────────────────────────────────────────────────

  async getRoleById(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new ApiException(404, 'ROLE_NOT_FOUND', 'Role not found');
    }
    return toResponse(role);
  }

  // ── updateRole ────────────────────────────────────────────────────────────

  async updateRole(id: string, input: UpdateRoleDto) {
    const existing = await this.prisma.role.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiException(404, 'ROLE_NOT_FOUND', 'Role not found');
    }

    // System roles can have their permissions updated, but their name cannot
    // be changed (the name is used as a stable identifier by seed scripts and
    // user provisioning).
    if (existing.isSystem && input.name && input.name !== existing.name) {
      throw new ApiException(
        400,
        'SYSTEM_ROLE_NAME_LOCKED',
        'The name of a system role cannot be changed',
      );
    }

    // Check uniqueness if name is being changed.
    if (input.name && input.name !== existing.name) {
      const taken = await this.prisma.role.findFirst({
        where: {
          name: { equals: input.name, mode: 'insensitive' },
          id: { not: id },
        },
        select: { id: true },
      });
      if (taken) {
        throw new ApiException(
          409,
          'ROLE_NAME_IN_USE',
          'A role with this name already exists',
        );
      }
    }

    const data: Record<string, unknown> = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.description !== undefined) data.description = input.description;
    if (input.permissions !== undefined)
      data.permissions = input.permissions as unknown as Prisma.InputJsonValue;
    if (input.isActive !== undefined) data.isActive = input.isActive;

    if (Object.keys(data).length === 0) {
      throw new ApiException(
        400,
        'VALIDATION_ERROR',
        'Provide at least one field to update',
      );
    }

    const role = await this.prisma.role.update({ where: { id }, data });
    return toResponse(role);
  }

  // ── deleteRole ────────────────────────────────────────────────────────────

  async deleteRole(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new ApiException(404, 'ROLE_NOT_FOUND', 'Role not found');
    }
    if (role.isSystem) {
      throw new ApiException(
        400,
        'SYSTEM_ROLE_PROTECTED',
        'System roles cannot be deleted',
      );
    }
    await this.prisma.role.delete({ where: { id } });
  }
}
