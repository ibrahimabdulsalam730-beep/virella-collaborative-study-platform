import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  const defaultPassword = "Password123!";
  const passwordHash = await bcrypt.hash(defaultPassword, 12);

  // 1. Test Student Account
  const student = await prisma.user.upsert({
    where: { email: "student@virella.edu" },
    update: {
      passwordHash,
      emailVerified: new Date(),
      onboardingComplete: true,
      role: Role.STUDENT,
    },
    create: {
      name: "Test Student",
      email: "student@virella.edu",
      passwordHash,
      role: Role.STUDENT,
      emailVerified: new Date(),
      onboardingComplete: true,
      studyGoals: ["Master Algorithms", "Pass Finals", "Deep Work Sessions"],
      subjects: ["Computer Science", "Mathematics", "Machine Learning"],
      image: "linear-gradient(135deg, #10b981, #047857)",
    },
  });

  console.log("✅ Seeded Student account:");
  console.log(`   Email:    ${student.email}`);
  console.log(`   Password: ${defaultPassword}`);
  console.log(`   Role:     ${student.role}`);

  // 2. Test Instructor Account
  const instructor = await prisma.user.upsert({
    where: { email: "instructor@virella.edu" },
    update: {
      passwordHash,
      emailVerified: new Date(),
      onboardingComplete: true,
      role: Role.INSTRUCTOR,
    },
    create: {
      name: "Dr. Alan Turing",
      email: "instructor@virella.edu",
      passwordHash,
      role: Role.INSTRUCTOR,
      emailVerified: new Date(),
      onboardingComplete: true,
      studyGoals: ["Curriculum Review", "Student Mentorship", "Proctored Exam Prep"],
      subjects: ["Theoretical CS", "Cryptography", "Distributed Systems"],
      image: "linear-gradient(135deg, #7c3aed, #4c1d95)",
    },
  });

  console.log("✅ Seeded Instructor account:");
  console.log(`   Email:    ${instructor.email}`);
  console.log(`   Password: ${defaultPassword}`);
  console.log(`   Role:     ${instructor.role}`);

  // 3. Super Admin Account
  const superAdminEmails = [
    (process.env.SUPER_ADMIN_EMAIL || "ibrahimabdulsalam.730@gmail.com").toLowerCase().trim(),
    "ibrahimabdulsalam730@gmail.com"
  ];
  for (const email of superAdminEmails) {
    const admin = await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash,
        role: Role.SUPER_ADMIN,
        emailVerified: new Date(),
        status: "ACTIVE",
      },
      create: {
        name: "Super Admin",
        email,
        passwordHash,
        role: Role.SUPER_ADMIN,
        status: "ACTIVE",
        emailVerified: new Date(),
        onboardingComplete: true,
        studyGoals: ["Platform Governance", "Security Audit", "System Health"],
        subjects: ["System Administration", "Security", "Full Stack Architecture"],
      },
    });

    console.log(`👑 Seeded Super Admin account: ${admin.email} (Password: ${defaultPassword})`);

    // Audit log entry for seeded admin
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "DATABASE_SEEDED",
        metadata: JSON.stringify({
          seededAccounts: [student.email, instructor.email, admin.email],
          superAdmin: admin.email,
          timestamp: new Date().toISOString(),
        }),
      },
    });
  }

  console.log("🌱 Database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
