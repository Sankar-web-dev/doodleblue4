import Stripe from 'stripe';
import { ApiException } from '../common/api-error.js';

/**
 * Shared Stripe SDK client for provisioning (creating products/prices
 * from admin actions). Plain module — the SDK is stateless, so a
 * singleton avoids a DI/module cycle between StripeModule and
 * MembershipPlansModule.
 */
let client: Stripe | null = null;

export function getStripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  client ??= new Stripe(key);
  return client;
}

/** Currency used for auto-provisioned membership prices. */
const PLAN_CURRENCY = (process.env.STRIPE_PLAN_CURRENCY || 'usd').toLowerCase();

function stripeFail(err: unknown): never {
  const msg = err instanceof Error ? err.message : String(err);
  throw new ApiException(
    502,
    'STRIPE_PROVISION_FAILED',
    `Could not create the plan in Stripe: ${msg}`,
  );
}

/**
 * Ensure a Stripe Product exists for a plan. If the plan already has a
 * provisioned Price we reuse its Product; otherwise we create one.
 */
export async function ensurePlanProduct(input: {
  name: string;
  description?: string | null;
  existingPriceId?: string | null;
}): Promise<string> {
  const stripe = getStripeClient();
  if (!stripe) {
    throw new ApiException(
      503,
      'STRIPE_NOT_CONFIGURED',
      'Stripe is not configured on this server',
    );
  }

  try {
    if (input.existingPriceId) {
      const price = await stripe.prices.retrieve(input.existingPriceId);
      const productId = price.product as string;
      // Keep the product name in sync with the plan name.
      await stripe.products.update(productId, {
        name: input.name,
        description: input.description ?? undefined,
      });
      return productId;
    }
    const product = await stripe.products.create({
      name: input.name,
      description: input.description ?? undefined,
    });
    return product.id;
  } catch (err) {
    stripeFail(err);
  }
}

/**
 * Create a recurring Price on a product. Amount is in major currency
 * units (199 → $199.00); Stripe stores it as cents.
 */
export async function createRecurringPrice(
  productId: string,
  amountMajor: number,
  interval: 'month' | 'year',
): Promise<string> {
  const stripe = getStripeClient();
  if (!stripe) {
    throw new ApiException(
      503,
      'STRIPE_NOT_CONFIGURED',
      'Stripe is not configured on this server',
    );
  }
  try {
    const price = await stripe.prices.create({
      product: productId,
      currency: PLAN_CURRENCY,
      unit_amount: Math.round(amountMajor * 100),
      recurring: { interval },
    });
    return price.id;
  } catch (err) {
    stripeFail(err);
  }
}

/** Archive a Price (Stripe prices can't be deleted, only deactivated). */
export async function archivePrice(priceId: string): Promise<void> {
  const stripe = getStripeClient();
  if (!stripe || !priceId) return;
  try {
    await stripe.prices.update(priceId, { active: false });
  } catch {
    /* best-effort — stale price stays listed but can't be checked out */
  }
}

/** Archive a Product when its plan is deleted. */
export async function archiveProductByPriceId(
  priceId: string | null | undefined,
): Promise<void> {
  const stripe = getStripeClient();
  if (!stripe || !priceId) return;
  try {
    const price = await stripe.prices.retrieve(priceId);
    await stripe.products.update(price.product as string, {
      active: false,
    });
  } catch {
    /* best-effort */
  }
}
