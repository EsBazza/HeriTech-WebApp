import "server-only";
import { z } from "zod";
import { fields } from "./http";

const imageList = z.array(z.string().min(1).max(8_000_000)).max(4);
const tagList = z.array(z.string().trim().min(1).max(40)).max(12);

export const productCreateSchema = z.object({
  title: fields.text(160),
  description: z.string().trim().max(4000).default(""),
  price: fields.money,
  images: imageList.min(1, "Add at least one photo."),
  sourceBatchId: fields.id,
  materialTags: tagList.default([]),
  stock: z.coerce.number().int().min(0).max(10_000).default(1),
  kgDiverted: fields.kg,
  // Optional: an empty name means the share goes to HeriTech's general charity & upkeep fund.
  ngoFundName: z.string().trim().max(160).default(""),
  // Admins only: give this piece away at the showcase booth instead of selling it.
  freeClaim: z.boolean().optional(),
});

export const productUpdateSchema = productCreateSchema.omit({ sourceBatchId: true }).partial();
