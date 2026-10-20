import "server-only";
import { db } from "@/lib/server/firestore";
import { notFound } from "@/lib/server/http";
import { withProductRelations } from "@/lib/server/views";

/**
 * The public impact record behind a pass QR code: the maker, origin batch and
 * money split. The buyer stays anonymous. Used by GET /api/verify/:serial and
 * by the verify page's link preview.
 */
export async function passRecord(serial: string) {
  const pass = (await db.passes().doc(serial.toUpperCase()).get()).data();
  if (!pass) throw notFound("No impact pass with that serial.");

  const order = (await db.orders().doc(pass.orderId).get()).data();
  const product = order && (await db.products().doc(order.productId).get()).data();
  if (!order || !product) throw notFound("The order behind this pass could not be found.");

  const [{ artisan, sourceBatch }] = await withProductRelations([product]);

  return {
    serial: pass.serial,
    issuedAt: pass.issuedAt,
    tamperEvidentHarvestHash: pass.harvestHash,
    product: {
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      kgDiverted: product.kgDiverted * order.quantity,
      image: product.images?.[0] ?? null,
    },
    escrowAudit: {
      totalAmount: order.amountPaid,
      artisanPayout: order.artisanPayout,
      lguShare: order.lguShare,
      charityMaintenanceShare: order.charityMaintenanceShare,
      ngoFundName: product.ngoFundName,
      paymentMode: order.paymentMode,
    },
    maker: {
      name: artisan?.fullName ?? null,
      workshop: artisan?.workshopName ?? null,
      country: artisan?.country ?? null,
      verified: artisan?.artisanVerified ?? false,
    },
    originHarvest: sourceBatch && {
      batchId: sourceBatch.id,
      materialType: sourceBatch.materialType,
      condition: sourceBatch.condition,
      weightKg: sourceBatch.weightKg,
      festival: sourceBatch.agreement?.festival ?? null,
      country: sourceBatch.agreement?.country ?? null,
      gpsCoordinates: { lat: sourceBatch.gpsLat, lng: sourceBatch.gpsLng },
      harvestLoggedAt: sourceBatch.createdAt,
      loggedByOfficer: sourceBatch.scannedByOfficer?.fullName ?? null,
      municipalityStation: sourceBatch.scannedByOfficer?.stationName ?? null,
      hasPhoto: Boolean(sourceBatch.imageUrl),
    },
  };
}

export type PassRecord = Awaited<ReturnType<typeof passRecord>>;
