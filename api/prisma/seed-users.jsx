const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Criando tenant e usuário admin…");

  // 1) Criar tenant principal
  const tenant = await prisma.tenant.upsert({
    where: { slug: "master" },
    update: {},
    create: {
      name: "Master Tenant",
      slug: "master",
    },
  });

  console.log("✓ Tenant criado:", tenant.slug);

  // 2) Criar usuário administrador
  const passwordHash = await bcrypt.hash("123456", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@kondor.dev" },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "admin@kondor.dev",
      name: "Administrador",
      role: "OWNER",   // seu schema NÃO possui SUPERADMIN
      passwordHash,
    },
  });

  console.log("✓ Usuário criado:", admin.email);

  console.log("🌱 Seed-finalizado!");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Criando tenant e usuário admin…");

  // 1) Criar tenant principal
  const tenant = await prisma.tenant.upsert({
    where: { slug: "master" },
    update: {},
    create: {
      name: "Master Tenant",
      slug: "master",
    },
  });

  console.log("✓ Tenant criado:", tenant.slug);

  // 2) Criar usuário administrador
  const passwordHash = await bcrypt.hash("123456", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@kondor.dev" },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "admin@kondor.dev",
      name: "Administrador",
      role: "OWNER",
      passwordHash,
    },
  });

  console.log("✓ Usuário criado:", admin.email);

  console.log("🌱 Seed-finalizado!");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Criando tenant e usuário admin…");

  // 1) Criar tenant principal
  const tenant = await prisma.tenant.upsert({
    where: { slug: "master" },
    update: {},
    create: {
      name: "Master Tenant",
      slug: "master",
    },
  });

  console.log("✓ Tenant criado:", tenant.slug);

  // 2) Criar usuário administrador
  const passwordHash = await bcrypt.hash("123456", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@kondor.dev" },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "admin@kondor.dev",
      name: "Administrador",
      role: "OWNER",
      passwordHash,
    },
  });

  console.log("✓ Usuário criado:", admin.email);

  console.log("🌱 Seed-finalizado!");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Criando tenant e usuário admin…");

  // 1) Criar tenant principal
  const tenant = await prisma.tenant.upsert({
    where: { slug: "master" },
    update: {},
    create: {
      name: "Master Tenant",
      slug: "master",
    },
  });

  console.log("✓ Tenant criado:", tenant.slug);

  // 2) Criar usuário administrador
  const passwordHash = await bcrypt.hash("123456", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@kondor.dev" },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "admin@kondor.dev",
      name: "Administrador",
      role: "OWNER",
      passwordHash,
    },
  });

  console.log("✓ Usuário criado:", admin.email);

  console.log("🌱 Seed-finalizado!");
}

main()
  .catch(e => console.error(e)) 
finally(() => prisma.$disconnect());


