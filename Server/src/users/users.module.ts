import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { MailerService } from '../mail/mailer.service.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

import { StorageModule } from '../storage/storage.module.js';

@Module({
  imports: [AuthModule, StorageModule],
  controllers: [UsersController],
  providers: [UsersService, MailerService],
})
export class UsersModule {}
