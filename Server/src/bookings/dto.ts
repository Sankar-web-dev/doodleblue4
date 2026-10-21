import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  BookingPaymentMethod,
  BookingStatus,
  PaymentStatus,
} from '../generated/prisma/enums.js';
import { PaginationQueryDto, toBool, trim } from '../common/dto.js';

export class CreateBookingDto {
  @IsUUID()
  gameId!: string;

  /** Slot start — ISO 8601 timestamp. */
  @IsDateString()
  startAt!: string;

  /** Slot end — ISO 8601 timestamp. */
  @IsDateString()
  endAt!: string;

  /** STRIPE pays online now; PAY_AT_CENTRE holds the slot, pay on arrival. */
  @IsEnum(BookingPaymentMethod)
  paymentMethod!: BookingPaymentMethod;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  customerNote?: string;
}

export class ListBookingsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsUUID()
  gameId?: string;

  /** Admin-only filter — list bookings for a specific customer. */
  @IsOptional()
  @IsUUID()
  userId?: string;

  /** Start-of-window filter (ISO date). */
  @IsOptional()
  @IsDateString()
  from?: string;

  /** End-of-window filter (ISO date). */
  @IsOptional()
  @IsDateString()
  to?: string;

  /** Include soft-deleted/cancelled bookings — default true. */
  @IsOptional()
  @Transform(toBool)
  includeCancelled?: boolean;
}

export class AvailabilityQueryDto {
  @IsUUID()
  gameId!: string;

  /** Day to check — YYYY-MM-DD. */
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be in YYYY-MM-DD format',
  })
  date!: string;
}

export class CancelBookingDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(300)
  reason?: string;
}

export class UpdateBookingStatusDto {
  /**
   * Allowed transitions: PENDING→CONFIRMED, CONFIRMED→COMPLETED/NO_SHOW,
   * PENDING|CONFIRMED→CANCELLED.
   */
  @IsOptional()
  @IsIn(['CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELLED'])
  status?: Exclude<BookingStatus, 'PENDING'>;

  /** Mark pay-at-centre bookings as paid when the customer settles up. */
  @IsOptional()
  @IsIn(['SUCCEEDED', 'FAILED', 'REFUNDED'])
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  adminNote?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(300)
  cancellationReason?: string;
}
