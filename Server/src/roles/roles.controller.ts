import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  AuthGuard,
  type AuthenticatedRequest,
} from '../auth/auth.guard.js';
import { RequirePasswordChangedGuard } from '../auth/require-password-changed.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { RequirePermission } from '../auth/permissions.decorator.js';
import { RolesService } from './roles.service.js';
import {
  CreateRoleDto,
  ListRolesQueryDto,
  UpdateRoleDto,
} from './dto.js';

@Controller('roles')
@UseGuards(AuthGuard, RequirePasswordChangedGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @Post()
  @RequirePermission('roles', 'create')
  async createRole(
    @Body() dto: CreateRoleDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return { data: { role: await this.roles.createRole(dto, req.user.id) } };
  }

  @Get()
  @RequirePermission('roles', 'read')
  async listRoles(@Query() query: ListRolesQueryDto) {
    const { data, meta } = await this.roles.listRoles(query);
    return { data, meta };
  }

  @Get(':id')
  @RequirePermission('roles', 'read')
  async getRole(@Param('id', ParseUUIDPipe) id: string) {
    return { data: { role: await this.roles.getRoleById(id) } };
  }

  @Patch(':id')
  @RequirePermission('roles', 'update')
  async updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return { data: { role: await this.roles.updateRole(id, dto) } };
  }

  @Delete(':id')
  @RequirePermission('roles', 'delete')
  async deleteRole(@Param('id', ParseUUIDPipe) id: string) {
    await this.roles.deleteRole(id);
    return { data: { message: 'Role deleted' } };
  }
}
