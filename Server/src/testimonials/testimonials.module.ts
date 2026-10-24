import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { TestimonialsController } from './testimonials.controller.js';
import { TestimonialsService } from './testimonials.service.js';

@Module({
  imports: [AuthModule],
  controllers: [TestimonialsController],
  providers: [TestimonialsService],
  exports: [TestimonialsService],
})
export class TestimonialsModule {}
