import { config } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

config({ path: '.env.local' });
config({ path: '.env' });

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const sampleTestimonials = [
  {
    rating: 5,
    headline: "Unreal PS5 Arena Experience!",
    content:
      "The 4K PS5 pods are absolutely next level. Low latency, incredible sound, and seamless booking. Played Mortal Kombat & FIFA with my squad all evening!",
    status: 'APPROVED' as const,
    isHero: true,
  },
  {
    rating: 5,
    headline: "Best Pool & Carrom boards in the city",
    content:
      "Spotless venue, tournament-grade tables, and instant checkout. The atmosphere and lighting make it the best weekend hangout spot.",
    status: 'APPROVED' as const,
    isHero: true,
  },
  {
    rating: 5,
    headline: "Seamless booking & pro setup",
    content:
      "From reserving online to walking straight to our assigned station without waiting, the experience was smooth. The staff was super helpful!",
    status: 'APPROVED' as const,
    isHero: true,
  },
  {
    rating: 4,
    headline: "Great vibe for competitive matches",
    content:
      "Loved the tournament vibe. High energy, great audio systems, and the membership plan saved us a lot on hourly rates.",
    status: 'PENDING' as const,
    isHero: false,
  },
];

async function main() {
  const users = await prisma.user.findMany({ take: 5 });
  if (users.length === 0) {
    console.log('No users found in database to associate testimonials with.');
    return;
  }

  console.log(`Found ${users.length} users. Checking existing testimonials...`);
  const count = await prisma.testimonial.count();
  if (count > 0) {
    console.log(`Testimonials already exist (${count} entries).`);
    return;
  }

  console.log('Seeding initial testimonials...');
  for (let i = 0; i < sampleTestimonials.length; i++) {
    const item = sampleTestimonials[i];
    const user = users[i % users.length];
    await prisma.testimonial.create({
      data: {
        userId: user.id,
        rating: item.rating,
        headline: item.headline,
        content: item.content,
        status: item.status,
        isHero: item.isHero,
      },
    });
  }

  console.log('Testimonials seeded successfully!');
}

main()
  .catch((err) => {
    console.error('Seed error:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
