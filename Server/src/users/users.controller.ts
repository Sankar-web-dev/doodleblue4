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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiException } from '../common/api-error.js';
import { avatarMulterOptions } from '../common/avatar-upload.js';
import {
  AuthGuard,
  type AuthenticatedRequest,
} from '../auth/auth.guard.js';
import { RequirePasswordChangedGuard } from '../auth/require-password-changed.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { RequirePermission } from '../auth/permissions.decorator.js';
import { UsersService } from './users.service.js';
import {
  CreateUserDto,
  ListUsersQueryDto,
  UpdateUserDto,
} from './dto.js';

import { StorageService } from '../storage/storage.service.js';

// User-account provisioning — SUPER_ADMIN (or any role granted users:*).
@Controller('users')
@UseGuards(AuthGuard, RequirePasswordChangedGuard, PermissionsGuard)
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly storage: StorageService,
  ) {}

  @Post()
  @RequirePermission('users', 'create')
  createUser(@Body() dto: CreateUserDto) {
    return this.users.createUser(dto).then((data) => ({ data }));
  }

  @Post('upload-avatar')
  @RequirePermission('users', 'create')
  @UseInterceptors(FileInterceptor('avatar', avatarMulterOptions))
  async uploadAvatar(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new ApiException(
        400,
        'NO_FILE_UPLOADED',
        'No image file provided',
      );
    }
    const saved = await this.storage.saveFile(file);
    return {
      data: {
        url: saved.url,
        filename: saved.filename,
        id: saved.id,
      },
    };
  }

  // Picker list — must precede :id so "options" isn't parsed as a uuid.
  @Get('options')
  @RequirePermission('users', 'read')
  async listUserOptions(@Req() req: AuthenticatedRequest) {
    return { data: await this.users.listUserOptions(req.user) };
  }

  @Get()
  @RequirePermission('users', 'read')
  async listUsers(
    @Query() query: ListUsersQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const { data, meta } = await this.users.listUsers(query, req.user);
    return { data, meta };
  }

  @Get(':id')
  @RequirePermission('users', 'read')
  async getUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return { data: { user: await this.users.getUserById(id, req.user) } };
  }

  @Patch(':id')
  @RequirePermission('users', 'update')
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return {
      data: { user: await this.users.updateUser(id, dto, req.user) },
    };
  }

  @Delete(':id')
  @RequirePermission('users', 'delete')
  async deleteUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.users.deleteUser(id, req.user);
    return { data: { message: 'User deleted' } };
  }
}
