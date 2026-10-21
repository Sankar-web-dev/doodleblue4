import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '../auth/auth.guard.js';
import { AdminGuard } from '../auth/admin.guard.js';
import { RequirePasswordChangedGuard } from '../auth/require-password-changed.guard.js';
import {
  CurrentUser,
} from '../auth/current-user.decorator.js';
import type { UserModel } from '../generated/prisma/models.js';
import { BookingsService } from './bookings.service.js';
import {
  AvailabilityQueryDto,
  CancelBookingDto,
  CreateBookingDto,
  ListBookingsQueryDto,
  UpdateBookingStatusDto,
} from './dto.js';

/**
 * Booking endpoints — any signed-in user can book and manage their own
 * bookings; /admin routes and status changes are SUPER_ADMIN only.
 */
@Controller('bookings')
@UseGuards(AuthGuard, RequirePasswordChangedGuard)
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  /** Booked intervals for a game on a day — ?gameId=&date=YYYY-MM-DD. */
  @Get('availability')
  availability(@Query() query: AvailabilityQueryDto) {
    return this.bookings.getAvailability(query).then((data) => ({ data }));
  }

  /** Own bookings for customers, all bookings for admins. */
  @Get()
  list(
    @Query() query: ListBookingsQueryDto,
    @CurrentUser() user: UserModel,
  ) {
    return this.bookings.listBookings(query, user).then((r) => ({
      data: r.data,
      meta: r.meta,
    }));
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: UserModel) {
    return this.bookings.getBooking(id, user).then((data) => ({ data }));
  }

  /**
   * Create a booking. PAY_AT_CENTRE confirms immediately; STRIPE returns
   * checkoutUrl — redirect the customer there to pay.
   */
  @Post()
  @Throttle({ default: { limit: 15, ttl: 60_000 } })
  create(
    @Body() dto: CreateBookingDto,
    @CurrentUser() user: UserModel,
  ) {
    return this.bookings.createBooking(user, dto).then((data) => ({ data }));
  }

  /** Customer (or admin) cancels a pending/confirmed booking. */
  @Post(':id/cancel')
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelBookingDto,
    @CurrentUser() user: UserModel,
  ) {
    return this.bookings
      .cancelBooking(id, user, dto.reason)
      .then((data) => ({ data }));
  }

  /** Admin status transitions + counter payment collection. */
  @Patch(':id/status')
  @UseGuards(AdminGuard)
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookings
      .updateBookingStatus(id, dto)
      .then((data) => ({ data }));
  }
}
