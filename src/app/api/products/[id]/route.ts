import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/products/[id] — artisan updates their product details
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      title,
      description,
      price,
      images,
      materialTags,
      stock,
      kgDiverted,
      ngoFundName,
    } = body;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: Number(price) }),
        ...(images !== undefined && {
          images: JSON.stringify(Array.isArray(images) ? images : [images]),
        }),
        ...(materialTags !== undefined && {
          materialTags: JSON.stringify(
            Array.isArray(materialTags) ? materialTags : [materialTags]
          ),
        }),
        ...(stock !== undefined && { stock: Number(stock) }),
        ...(kgDiverted !== undefined && { kgDiverted: Number(kgDiverted) }),
        ...(ngoFundName !== undefined && { ngoFundName }),
      },
      include: {
        artisan: { select: { id: true, fullName: true, workshopName: true } },
        sourceBatch: { include: { agreement: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Product updated successfully.",
      data: {
        ...updated,
        images: JSON.parse(updated.images),
        materialTags: JSON.parse(updated.materialTags),
      },
    });
  } catch (error) {
    console.error("Failed to update product:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] — artisan removes their listing
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    await prisma.product.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Product removed from marketplace.",
    });
  } catch (error) {
    console.error("Failed to delete product:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
