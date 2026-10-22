import type { Query } from "firebase-admin/firestore";
import type { ProductDoc } from "@/lib/firebase/types";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/firestore";
import { badRequest, forbidden, ok, parseBody, route } from "@/lib/server/http";
import { storeImage } from "@/lib/server/images";
import { productCreateSchema } from "@/lib/server/productInput";
import { newestFirst, withProductRelations } from "@/lib/server/views";

/** GET /api/products?artisanId= — marketplace listings, newest first. */
export const GET = route(async (request: Request) => {
  const artisanId = new URL(request.url).searchParams.get("artisanId");
  let query: Query<ProductDoc> = db.products();
  if (artisanId) query = query.where("artisanId", "==", artisanId);

  const products = (await query.get()).docs.map((d) => d.data()).filter((p) => !p.archived).sort(newestFirst);
  return ok(await withProductRelations(products), {
    headers: artisanId ? undefined : { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" },
  });
});

/** POST /api/products — an artisan lists a piece made from a batch they claimed. */
export const POST = route(async (request: Request) => {
  const artisan = await requireUser(request, ["artisan"]);
  const input = await parseBody(request, productCreateSchema);
  if (input.freeClaim && artisan.role !== "admin") throw forbidden("Only an admin can make a piece free to claim.");

  const batch = (await db.batches().doc(input.sourceBatchId).get()).data();
  if (!batch) throw badRequest("Source batch not found.");
  if (batch.status !== "claimed") throw badRequest("You can only list pieces made from a batch you have picked up.");
  if (batch.claimedByArtisanId !== artisan.id && artisan.role !== "admin") {
    throw forbidden("That batch was picked up by another artisan.");
  }
  if (input.kgDiverted > batch.weightKg) throw badRequest(`kgDiverted can't exceed the batch weight of ${batch.weightKg} kg.`);

  const ref = db.products().doc();
  const product: ProductDoc = {
    ...input,
    id: ref.id,
    images: await Promise.all(input.images.map((img) => storeImage(img, "products"))),
    artisanId: batch.claimedByArtisanId ?? artisan.id,
    createdAt: new Date().toISOString(),
  };
  await ref.create(product);

  const [view] = await withProductRelations([product]);
  return ok(view, { status: 201, message: "Listed on the marketplace, linked to its source batch." });
});
