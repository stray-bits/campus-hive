import { PrismaClient } from "@prisma/client/extension";

const prisma = new PrismaClient();

async function main() {
  const categories = [
    'General',
    'Academics',
    'Events',
    'Lost & Found',
    'Hostel',
    'Clubs',
    'Internships',
    'Other',
  ];

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());