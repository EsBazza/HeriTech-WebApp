import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/products - List all upcycled marketplace products
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const artisanId = searchParams.get("artisanId");

    const where: Record<string, unknown> = {};
    if (artisanId) where.artisanId = artisanId;

    const products = await prisma.product.findMany({
      where,
      include: {
        artisan: {
          select: {
            id: true,
            fullName: true,
            workshopName: true,
            country: true,
            avatarUrl: true,
          },
        },
        sourceBatch: {
          include: {
            agreement: true,
            scannedByOfficer: {
              select: { fullName: true, stationName: true, country: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = products.map((p) => ({
      ...p,
      images: JSON.parse(p.images || "[]"),
      materialTags: JSON.parse(p.materialTags || "[]"),
    }));

    return NextResponse.json({ success: true, count: formatted.length, data: formatted });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error fetching products" },
      { status: 500 }
    );
  }
}

// POST /api/products - Artisan lists a new upcycled product (Act 4)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      price,
      images,
      artisanId,
      sourceBatchId,
      materialTags,
      stock,
      kgDiverted,
      ngoFundName,
    } = body;

    if (!title || !price || !artisanId || !sourceBatchId || !kgDiverted || !ngoFundName) {
      return NextResponse.json(
        { success: false, error: "Missing required product or provenance fields" },
        { status: 400 }
      );
    }

    // Verify source batch exists
    const batch = await prisma.materialBatch.findUnique({
      where: { id: sourceBatchId },
    });

    if (!batch) {
      return NextResponse.json(
        { success: false, error: "Source material batch not found" },
        { status: 404 }
      );
    }

    const product = await prisma.product.create({
      data: {
        title,
        description: description || "",
        price: Number(price),
        images: JSON.stringify(Array.isArray(images) ? images : [images]),
        artisanId,
        sourceBatchId,
        materialTags: JSON.stringify(Array.isArray(materialTags) ? materialTags : []),
        stock: stock ? Number(stock) : 1,
        kgDiverted: Number(kgDiverted),
        ngoFundName,
      },
      include: {
        artisan: true,
        sourceBatch: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Product listed successfully with immutable source batch provenance link.",
        data: {
          ...product,
          images: JSON.parse(product.images),
          materialTags: JSON.parse(product.materialTags),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create product:", error);
    return NextResponse.json(
      { success: false, error: "Failed to list upcycled product" },
      { status: 500 }
    );
  }
}
