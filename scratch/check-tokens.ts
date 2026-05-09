import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const tokens = await prisma.pushToken.findMany();
  console.log('Total tokens:', tokens.length);
  const platforms = tokens.reduce((acc: any, t: any) => {
    acc[t.platform] = (acc[t.platform] || 0) + 1;
    return acc;
  }, {});
  console.log('Platforms:', platforms);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
