import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { TestimonialStatus } from '../generated/prisma/enums.js';
import { PaginationQueryDto, toBool, trim } from '../common/dto.js';

export class CreateTestimonialDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(120)
  headline?: string;

  @Transform(trim)
  @IsString()
  @MinLength(5)
  @MaxLength(1500)
  content!: string;
}

export class UpdateTestimonialStatusDto {
  @IsEnum(TestimonialStatus)
  status!: TestimonialStatus;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  adminNote?: string;
}

export class SetHeroTestimonialDto {
  @Type(() => Boolean)
  @IsBoolean()
  isHero!: boolean;
}

export class ListTestimonialsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(TestimonialStatus)
  status?: TestimonialStatus;

  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  isHero?: boolean;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(120)
  search?: string;
}
