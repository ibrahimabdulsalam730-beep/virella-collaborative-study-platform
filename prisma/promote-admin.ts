import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.SUPER_ADMIN_EMAIL || "ibrahimabdulsalam.730@gmail.com").toLowerCase().trim();
  console.log(`🔍 Checking account for Super Admin promotion: ${email}`);

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.error(`❌ No account found with email ${email}. The user must first register or sign in.`);
    process.exit(1);
  }

  if (!user.emailVerified) {
    console.error(`❌ Account ${email} exists, but email is NOT verified yet. Verification is strictly required.`);
    process.exit(1);
  }

  const updated = await prisma.user.update({
    where: { email },
    data: {
      role: Role.SUPER_ADMIN,
      status: "ACTIVE",
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: updated.id,
      action: "ADMIN_PROMOTED_SUPER_ADMIN",
      metadata: JSON.stringify({
        email,
        promotedAt: new Date().toISOString(),
        promotedBy: "CLI_PROMOTION_SCRIPT",
      }),
    },
  });

  console.log(`✅ Successfully promoted ${email} to SUPER_ADMIN!`);
  console.log(`   User ID: ${updated.id}`);
  console.log(`   Role:    ${updated.role}`);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
