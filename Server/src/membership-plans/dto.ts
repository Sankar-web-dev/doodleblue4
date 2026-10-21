import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PaginationQueryDto, toBool, trim } from '../common/dto.js';

export class CreateMembershipPlanDto {
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(2000)
  description?: string;

  /** Discount applied to bookings for members (e.g. 10 = 10% off). */
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  discountPercent!: number;

  /** Displayed monthly price (major unit). Null if not offered monthly. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10_000_000)
  monthlyPrice?: number;

  /** Displayed yearly price (major unit). Null if not offered yearly. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10_000_000)
  yearlyPrice?: number;

  /** Stripe recurring Price ID for monthly billing (price_...). */
  @IsOptional()
  @Transform(trim)
  @IsString()
  @Matches(/^price_[A-Za-z0-9]+$/, {
    message: 'stripeMonthlyPriceId must be a Stripe Price ID (price_...)',
  })
  stripeMonthlyPriceId?: string;

  /** Stripe recurring Price ID for yearly billing (price_...). */
  @IsOptional()
  @Transform(trim)
  @IsString()
  @Matches(/^price_[A-Za-z0-9]+$/, {
    message: 'stripeYearlyPriceId must be a Stripe Price ID (price_...)',
  })
  stripeYearlyPriceId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10_000)
  sortOrder?: number;
}

export class UpdateMembershipPlanDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10_000_000)
  monthlyPrice?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10_000_000)
  yearlyPrice?: number | null;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Matches(/^price_[A-Za-z0-9]+$/, {
    message: 'stripeMonthlyPriceId must be a Stripe Price ID (price_...)',
  })
  stripeMonthlyPriceId?: string | null;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Matches(/^price_[A-Za-z0-9]+$/, {
    message: 'stripeYearlyPriceId must be a Stripe Price ID (price_...)',
  })
  stripeYearlyPriceId?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10_000)
  sortOrder?: number;
}

export class ListMembershipPlansQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  search?: string;

  /** Admin filter — public list always shows active only. */
  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  isActive?: boolean;
}
