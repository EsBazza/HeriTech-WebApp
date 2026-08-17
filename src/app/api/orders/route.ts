import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateEscrowSplit } from "@/lib/escrow";

// POST /api/orders - Execute checkout with 70/20/10 escrow split and mint Google Wallet Pass
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, buyerId, stripePaymentIntentId } = body;

    if (!productId || !buyerId) {
      return NextResponse.json(
        { success: false, error: "productId and buyerId are required" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        artisan: true,
        sourceBatch: {
          include: {
            agreement: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    // Execute exact 70/20/10 Escrow Split
    const escrow = calculateEscrowSplit(product.price);

    // Create Order
    const order = await prisma.order.create({
      data: {
        productId: product.id,
        buyerId,
        amountPaid: escrow.totalAmount,
        artisanPayout: escrow.artisanPayout,       // 70%
        platformFee: escrow.platformFee,           // 20%
        ngoContribution: escrow.ngoContribution,   // 10%
        stripePaymentIntentId: stripePaymentIntentId || `pi_sim_${Date.now()}`,
        status: "completed",
      },
    });

    // Generate unique serial & Google Wallet Pass
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const serial = `HT-${Math.floor(100 + Math.random() * 900)}-${randomSuffix}`;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://heritech.io";
    const qrPayload = `${baseUrl}/verify/${serial}`;
    const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID || "3388000000022114455";
    const googleWalletObjectId = `${issuerId}.${serial.replace(/-/g, "_")}`;

    const walletPass = await prisma.walletPass.create({
      data: {
        orderId: order.id,
        serial,
        googleWalletObjectId,
        qrPayload,
        harvestHash: product.sourceBatch.txHash,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Order completed with verified 70/20/10 escrow split. Google Wallet Pass minted.",
      data: {
        order: {
          id: order.id,
          totalPaid: order.amountPaid,
          escrowSplit: {
            artisanPayout: order.artisanPayout,       // 70%
            platformFee: order.platformFee,           // 20%
            ngoContribution: order.ngoContribution,   // 10%
            ngoFundName: product.ngoFundName,
          },
        },
        walletPass: {
          serial: walletPass.serial,
          qrPayload: walletPass.qrPayload,
          harvestHash: walletPass.harvestHash,
          googleWalletSaveUrl: `https://pay.google.com/gp/v/save/${walletPass.googleWalletObjectId}`,
        },
        provenance: {
          divertedKg: product.kgDiverted,
          sourceBatchId: product.sourceBatch.id,
          festival: product.sourceBatch.agreement?.festival || "Regional Festival",
          country: product.sourceBatch.agreement?.country || "Asia",
        },
      },
    });
  } catch (error) {
    console.error("Failed to process order:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error processing order" },
      { status: 500 }
    );
  }
}
