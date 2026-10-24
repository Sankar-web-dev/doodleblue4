import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { GameStatus } from '../generated/prisma/enums.js';
import { PaginationQueryDto, trim } from '../common/dto.js';

export class CreateGameDto {
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  /** Optional — auto-generated from name when omitted. */
  @IsOptional()
  @Transform(trim)
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase words separated by hyphens',
  })
  @MaxLength(140)
  slug?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(2000)
  description?: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  category!: string;

  /** http(s) URL or a site-relative path served by the API (e.g. /api/v1/storage/<id>). */
  @IsOptional()
  @Matches(/^(\/|https?:\/\/)\S+$/, {
    message: 'imageUrl must be an http(s) URL or a path starting with /',
  })
  @MaxLength(500)
  imageUrl?: string;

  /** Price per hour in the currency's major unit (e.g. INR 199.00). */
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1_000_000)
  pricePerHour!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(15)
  @Max(1440)
  minBookingMins?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(15)
  @Max(1440)
  maxBookingMins?: number;

  /** Boards/stations — simultaneous bookings allowed for this game. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  capacity?: number;

  /** Players per booking/session — shown to customers. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  maxPlayers?: number;

  @IsOptional()
  @IsEnum(GameStatus)
  status?: GameStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10_000)
  sortOrder?: number;
}

export class UpdateGameDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase words separated by hyphens',
  })
  @MaxLength(140)
  slug?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(60)
  category?: string;

  /** http(s) URL or a site-relative path served by the API (e.g. /api/v1/storage/<id>). */
  @IsOptional()
  @Matches(/^(\/|https?:\/\/)\S+$/, {
    message: 'imageUrl must be an http(s) URL or a path starting with /',
  })
  @MaxLength(500)
  imageUrl?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1_000_000)
  pricePerHour?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(15)
  @Max(1440)
  minBookingMins?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(15)
  @Max(1440)
  maxBookingMins?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  capacity?: number;

  /** Players per booking/session — shown to customers. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  maxPlayers?: number;

  @IsOptional()
  @IsEnum(GameStatus)
  status?: GameStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10_000)
  sortOrder?: number;
}

export class ListGamesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  category?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  search?: string;
}
