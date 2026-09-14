import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("HelseAdmin123!", 12);

  const superadmin = await prisma.user.upsert({
    where: { email: "jose@helsecolombia.com" },
    update: {},
    create: {
      email: "jose@helsecolombia.com",
      name: "Jose Superadmin",
      role: "SUPERADMIN",
      passwordHash,
    },
  });

  const nutri = await prisma.user.upsert({
    where: { email: "nutricion@helsecolombia.com" },
    update: {},
    create: {
      email: "nutricion@helsecolombia.com",
      name: "Nutricionista PAP",
      role: "NUTRICIONISTA",
      passwordHash: await bcrypt.hash("Nutri1234!", 12),
    },
  });

  const patient = await prisma.patient.upsert({
    where: { documentId: "1000000001" },
    update: {},
    create: {
      documentId: "1000000001",
      firstName: "Ana",
      lastName: "Paciente Demo",
      phone: "573000000001",
      caregiverName: "Luis Acudiente",
      caregiverPhone: "573000000002",
      diagnosis: "Epilepsia refractaria — dieta cetogénica Ketolance",
      mipresStatus: "Formulado",
      ketolanceActive: true,
      active: true,
      consentAt: new Date(),
    },
  });

  await prisma.patientAssignment.upsert({
    where: {
      userId_patientId: { userId: nutri.id, patientId: patient.id },
    },
    update: {},
    create: { userId: nutri.id, patientId: patient.id },
  });

  console.log("Listo. Superadmin:", superadmin.email);
}

main()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
