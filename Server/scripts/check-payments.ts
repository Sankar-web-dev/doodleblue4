import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const payments = await prisma.payment.findMany({
  select: { status: true, amount: true, type: true, createdAt: true },
  orderBy: { createdAt: 'desc' },
});
console.log('PAYMENTS:', JSON.stringify(payments, null, 1));

const bookings = await prisma.booking.findMany({
  select: {
    totalAmount: true,
    status: true,
    paymentStatus: true,
    paymentMethod: true,
    createdAt: true,
  },
  orderBy: { createdAt: 'desc' },
  take: 10,
});
console.log('BOOKINGS:', JSON.stringify(bookings, null, 1));

await prisma.$disconnect();
