import { IsEnum, IsUUID } from 'class-validator';
import { BillingInterval } from '../generated/prisma/enums.js';

/**
 * Membership checkout request — only the plan id + interval come from the
 * client; the Stripe Price ID is resolved server-side from the plan row.
 */
export class CheckoutDto {
  @IsUUID()
  membershipPlanId!: string;

  @IsEnum(BillingInterval)
  billingInterval!: BillingInterval;
}
