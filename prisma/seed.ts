// Seeds one admin user. Run with `npm run seed`.
// Credentials come from environment variables so nothing sensitive is
// committed to the repo. Falls back to a dev-only default with a loud
// warning so it's obvious in logs if the env vars were forgotten.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@leaddesk.local";
  const password = process.env.ADMIN_PASSWORD || "changeme123";

  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    console.warn(
      "⚠️  ADMIN_EMAIL / ADMIN_PASSWORD not set in .env — using dev defaults. " +
        "Set them before deploying anywhere real."
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });

  console.log(`✅ Admin user ready: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
