import "server-only";
import { z } from "zod";
import { fields } from "./http";

const imageList = z.array(z.string().min(1).max(8_000_000)).max(4);
const tagList = z.array(z.string().trim().min(1).max(40)).max(12);

const description = z.string().trim().max(4000);
const stock = z.coerce.number().int().min(0).max(10_000);
// Optional: an empty name means the share goes to HeriTech's general charity & upkeep fund.
const ngoFundName = z.string().trim().max(160);

/** Editable listing fields without defaults, so an update only holds what was sent. */
const editableFields = z.object({
  title: fields.text(160),
  description,
  price: fields.money,
  images: imageList.min(1, "Add at least one photo."),
  materialTags: tagList,
  stock,
  kgDiverted: fields.kg,
  ngoFundName,
  // Admins only: give this piece away at the showcase booth instead of selling it.
  freeClaim: z.boolean().optional(),
});

export const productCreateSchema = editableFields.extend({
  sourceBatchId: fields.id,
  description: description.default(""),
  materialTags: tagList.default([]),
  stock: stock.default(1),
  ngoFundName: ngoFundName.default(""),
});

// Zod 4 applies .default() even inside .partial(), which would reset unsent fields on every edit.
export const productUpdateSchema = editableFields.partial();
