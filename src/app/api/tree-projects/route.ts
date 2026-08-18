import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const orders = await prisma.order.aggregate({
      _sum: {
        ngoContribution: true,
      },
    });

    const totalNgoFunds = orders._sum.ngoContribution || 16.20;

    const projects = [
      {
        id: "proj-ph-01",
        title: "Cordillera Heritage Bamboo & Narra Reforestation",
        ngoName: "Cordillera Ecological Protection Trust",
        location: "Benguet, Philippines",
        lat: 16.4023,
        lng: 120.5960,
        allocatedFundsUsd: totalNgoFunds * 0.5,
        treesPlanted: Math.floor((totalNgoFunds * 0.5) / 5) + 180,
        survivalRate: 96.4,
        species: ["Giant Bamboo", "Narra"],
        hectaresRestored: 3.2,
        googleEarthUrl: "https://earth.google.com/web/@16.4023,120.5960,1500a,800d,35y,0h,0t,0r",
        baselineImage: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800",
        currentSatelliteImage: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800"
      },
      {
        id: "proj-th-02",
        title: "Chiang Mai Teak & Watershed Protection",
        ngoName: "Northern Thailand Forest Conservation Fund",
        location: "Chiang Mai, Thailand",
        lat: 18.7883,
        lng: 98.9853,
        allocatedFundsUsd: totalNgoFunds * 0.3,
        treesPlanted: Math.floor((totalNgoFunds * 0.3) / 5) + 120,
        survivalRate: 94.8,
        species: ["Teak Wood", "Wild Banana"],
        hectaresRestored: 2.1,
        googleEarthUrl: "https://earth.google.com/web/@18.7883,98.9853,1200a,800d,35y,0h,0t,0r",
        baselineImage: "https://images.unsplash.com/photo-1511497584788-876761c119ef?w=800",
        currentSatelliteImage: "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=800"
      },
      {
        id: "proj-jp-03",
        title: "Mount Fuji Watershed Reforestation Project",
        ngoName: "Japan Alpine Ecosystem Trust",
        location: "Shizuoka, Japan",
        lat: 35.3606,
        lng: 138.7274,
        allocatedFundsUsd: totalNgoFunds * 0.2,
        treesPlanted: Math.floor((totalNgoFunds * 0.2) / 5) + 95,
        survivalRate: 98.1,
        species: ["Japanese Cedar", "Hinoki Cypress"],
        hectaresRestored: 1.8,
        googleEarthUrl: "https://earth.google.com/web/@35.3606,138.7274,2500a,800d,35y,0h,0t,0r",
        baselineImage: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800",
        currentSatelliteImage: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800"
      }
    ];

    return NextResponse.json({ success: true, data: projects });
  } catch (error) {
    console.error("Error fetching tree projects:", error);
    return NextResponse.json({ success: false, error: "Failed to load tree projects" }, { status: 500 });
  }
}
