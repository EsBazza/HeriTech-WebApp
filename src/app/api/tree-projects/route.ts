import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export interface YearlyProgress {
  year: number;
  treesPlanted: number;
  survivalRate: number;
  allocatedFundsUsd: number;
  hectaresRestored: number;
  statusLabel: string;
  satelliteImage: string;
}

export interface TreeProject {
  id: string;
  title: string;
  ngoName: string;
  location: string;
  lat: number;
  lng: number;
  allocatedFundsUsd: number;
  treesPlanted: number;
  survivalRate: number;
  species: string[];
  hectaresRestored: number;
  googleEarthUrl: string;
  baselineImage: string;
  currentSatelliteImage: string;
  yearlyProgress: Record<number, YearlyProgress>;
}

function generateYearlyProgress(
  treesPlanted: number,
  allocatedFundsUsd: number,
  hectaresRestored: number,
  survivalRate: number,
  baselineImage?: string,
  currentSatelliteImage?: string
): Record<number, YearlyProgress> {
  return {
    2020: {
      year: 2020,
      treesPlanted: 0,
      survivalRate: 0,
      allocatedFundsUsd: 0,
      hectaresRestored: 0,
      statusLabel: "Unforested Baseline (Year 0)",
      satelliteImage: baselineImage || "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200",
    },
    2021: {
      year: 2021,
      treesPlanted: Math.round(treesPlanted * 0.15),
      survivalRate: 82,
      allocatedFundsUsd: Math.round(allocatedFundsUsd * 0.20 * 100) / 100,
      hectaresRestored: Math.round(hectaresRestored * 0.15 * 10) / 10,
      statusLabel: "Phase 1: Nursery & Soil Prep",
      satelliteImage: "https://images.unsplash.com/photo-1511497584788-876761c119ef?w=1200",
    },
    2022: {
      year: 2022,
      treesPlanted: Math.round(treesPlanted * 0.35),
      survivalRate: 88,
      allocatedFundsUsd: Math.round(allocatedFundsUsd * 0.40 * 100) / 100,
      hectaresRestored: Math.round(hectaresRestored * 0.35 * 10) / 10,
      statusLabel: "Phase 2: Sapling Propagation",
      satelliteImage: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200",
    },
    2023: {
      year: 2023,
      treesPlanted: Math.round(treesPlanted * 0.55),
      survivalRate: 92,
      allocatedFundsUsd: Math.round(allocatedFundsUsd * 0.60 * 100) / 100,
      hectaresRestored: Math.round(hectaresRestored * 0.55 * 10) / 10,
      statusLabel: "Phase 3: Native Canopy Growth",
      satelliteImage: "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=1200",
    },
    2024: {
      year: 2024,
      treesPlanted: Math.round(treesPlanted * 0.75),
      survivalRate: 94,
      allocatedFundsUsd: Math.round(allocatedFundsUsd * 0.75 * 100) / 100,
      hectaresRestored: Math.round(hectaresRestored * 0.75 * 10) / 10,
      statusLabel: "Phase 4: Ecosystem Recovery",
      satelliteImage: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200",
    },
    2025: {
      year: 2025,
      treesPlanted: Math.round(treesPlanted * 0.90),
      survivalRate: 95,
      allocatedFundsUsd: Math.round(allocatedFundsUsd * 0.90 * 100) / 100,
      hectaresRestored: Math.round(hectaresRestored * 0.90 * 10) / 10,
      statusLabel: "Phase 5: Canopy Verification",
      satelliteImage: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200",
    },
    2026: {
      year: 2026,
      treesPlanted,
      survivalRate,
      allocatedFundsUsd: Math.round(allocatedFundsUsd * 100) / 100,
      hectaresRestored,
      statusLabel: "Phase 6: Audited Live Canopy",
      satelliteImage: currentSatelliteImage || "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200",
    },
  };
}

export async function GET() {
  try {
    const orders = await prisma.order.aggregate({
      _sum: {
        ngoContribution: true,
      },
    });

    const totalNgoFunds = orders._sum.ngoContribution || 16.20;

    const baseProjects = [
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
        baselineImage: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200",
        currentSatelliteImage: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200"
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
        baselineImage: "https://images.unsplash.com/photo-1511497584788-876761c119ef?w=1200",
        currentSatelliteImage: "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=1200"
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
        baselineImage: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200",
        currentSatelliteImage: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200"
      }
    ];

    const projects: TreeProject[] = baseProjects.map((p) => ({
      ...p,
      yearlyProgress: generateYearlyProgress(
        p.treesPlanted,
        p.allocatedFundsUsd,
        p.hectaresRestored,
        p.survivalRate,
        p.baselineImage,
        p.currentSatelliteImage
      ),
    }));

    return NextResponse.json({ success: true, data: projects });
  } catch (error) {
    console.error("Error fetching tree projects:", error);
    return NextResponse.json({ success: false, error: "Failed to load tree projects" }, { status: 500 });
  }
}
