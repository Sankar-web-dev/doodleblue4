import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { SUBSCRIPTION_PLANS } from './plans.js';

export class CheckoutDto {
  /** Plan key — must be one of the configured SUBSCRIPTION_PLANS. */
  @IsString()
  @IsNotEmpty()
  @IsIn(SUBSCRIPTION_PLANS)
  plan!: string;
}
