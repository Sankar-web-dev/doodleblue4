/**
 * Seed the catalog: membership plans (wired to the Stripe Price IDs in
 * .env.local) and a few sample games. Safe to re-run — upserts by unique
 * fields. Run with: pnpm seed:catalog
 */
import { config } from 'dotenv';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

config({ path: '.env.local' });
config({ path: '.env' });

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const membershipPlans = [
  {
    name: 'Basic',
    description: 'Starter membership — save on every session.',
    discountPercent: 5,
    monthlyPrice: 199,
    yearlyPrice: 1999,
    stripeMonthlyPriceId: process.env.STRIPE_PRICE_BASIC,
    stripeYearlyPriceId: null,
    sortOrder: 0,
  },
  {
    name: 'Pro',
    description: 'For regulars — bigger discount on all bookings.',
    discountPercent: 10,
    monthlyPrice: 499,
    yearlyPrice: 4999,
    stripeMonthlyPriceId: process.env.STRIPE_PRICE_PRO,
    stripeYearlyPriceId: null,
    sortOrder: 1,
  },
  {
    name: 'Premium',
    description: 'Best value — maximum discount, billed yearly.',
    discountPercent: 15,
    monthlyPrice: null,
    yearlyPrice: 3999,
    stripeMonthlyPriceId: null,
    stripeYearlyPriceId: process.env.STRIPE_PRICE_PREMIUM,
    sortOrder: 2,
  },
];

const games = [
  {
    name: 'PlayStation 5 Arena',
    slug: 'ps5-arena',
    description: 'Private PS5 booths with 4K displays and surround sound.',
    category: 'Console Gaming',
    pricePerHour: 199,
    capacity: 4,
    sortOrder: 0,
  },
  {
    name: 'PC Gaming Zone',
    slug: 'pc-gaming-zone',
    description: 'High-refresh esports rigs for competitive play.',
    category: 'PC Gaming',
    pricePerHour: 149,
    capacity: 8,
    sortOrder: 1,
  },
  {
    name: 'VR Experience',
    slug: 'vr-experience',
    description: 'Room-scale VR headsets with the latest titles.',
    category: 'Virtual Reality',
    pricePerHour: 299,
    capacity: 2,
    sortOrder: 2,
  },
  {
    name: 'Snooker Table',
    slug: 'snooker-table',
    description: 'Full-size professional snooker table.',
    category: 'Board Games',
    pricePerHour: 250,
    capacity: 1,
    sortOrder: 3,
  },
  {
    name: 'Racing Simulator',
    slug: 'racing-simulator',
    description: 'Force-feedback wheel and triple-screen racing rig.',
    category: 'Sim Racing',
    pricePerHour: 349,
    capacity: 1,
    sortOrder: 4,
  },
];

async function main() {
  for (const plan of membershipPlans) {
    const { name, ...rest } = plan;
    await prisma.membershipPlan.upsert({
      where: { name },
      update: rest,
      create: { name, ...rest },
    });
    console.log(`plan: ${name}`);
  }

  for (const game of games) {
    const { slug, ...rest } = game;
    await prisma.game.upsert({
      where: { slug },
      update: rest,
      create: { slug, ...rest },
    });
    console.log(`game: ${game.name}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
