const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Criando tenant e usuário admin…");

  // 1) Criar ou reaproveitar tenant "master"
  const tenant = await prisma.tenant.upsert({
    where: { slug: "master" },
    update: {},
    create: {
      name: "Master Tenant",
      slug: "master",
    },
  });

  console.log("✓ Tenant:", tenant.slug, tenant.id);

  // 2) Verificar se usuário já existe
  let admin = await prisma.user.findFirst({
    where: { email: "admin@kondor.dev" },
  });

  if (!admin) {
    console.log("Criando usuário admin@kondor.dev…");
    const passwordHash = await bcrypt.hash("123456", 10);

    admin = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: "admin@kondor.dev",
        name: "Administrador",
        role: "OWNER", // seu enum Role
        passwordHash,
      },
    });
  } else {
    console.log("Usuário admin@kondor.dev já existia, mantendo dados.");
  }

  console.log("✓ Usuário pronto:", admin.email);
  console.log("🌱 Seed-finalizado!");
}

main()
  .catch((e) => {
    console.error("Erro no seed-users:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

