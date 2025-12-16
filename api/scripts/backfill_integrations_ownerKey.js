/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function looksLikeE164(phone) {
  if (!phone) return false;
  return /^\+\d{8,15}$/.test(phone.trim());
}

async function main() {
  console.log("Backfill: integrations ownerType/ownerKey + client whatsappNumberE164 (safe)");

  const integrations = await prisma.integration.findMany();

  let updated = 0;
  for (const itg of integrations) {
    // Decide ownerType/ownerKey
    let ownerType = "AGENCY";
    let ownerKey = "AGENCY";
    let clientId = itg.clientId ?? null;

    if (itg.provider === "WHATSAPP") {
      ownerType = "AGENCY";
      ownerKey = "AGENCY";
      clientId = null;
    } else if (itg.clientId) {
      ownerType = "CLIENT";
      ownerKey = itg.clientId;
    } else {
      // integrações antigas sem clientId ficam como AGENCY por enquanto
      ownerType = "AGENCY";
      ownerKey = "AGENCY";
    }

    // Só atualiza se precisar (evita writes desnecessários)
    const needsUpdate =
      itg.ownerType !== ownerType ||
      itg.ownerKey !== ownerKey ||
      (itg.provider === "WHATSAPP" && itg.clientId !== null);

    if (needsUpdate) {
      await prisma.integration.update({
        where: { id: itg.id },
        data: { ownerType, ownerKey, clientId },
      });
      updated++;
    }
  }

  console.log(`Integrations atualizadas: ${updated}`);

  // Backfill whatsappNumberE164 (somente se o phone já estiver em E.164)
  const clients = await prisma.client.findMany({
    select: { id: true, phone: true, whatsappNumberE164: true },
  });

  let clientsUpdated = 0;
  for (const c of clients) {
    if (!c.whatsappNumberE164 && looksLikeE164(c.phone)) {
      await prisma.client.update({
        where: { id: c.id },
        data: { whatsappNumberE164: c.phone.trim() },
      });
      clientsUpdated++;
    }
  }

  console.log(`Clients whatsappNumberE164 preenchidos (somente E.164 válido): ${clientsUpdated}`);
  console.log("Backfill concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
