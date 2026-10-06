import { ThawingItem, FabricationSegment } from '../types';

export interface ShrinkageCalculationResult {
  bahanAwalKg: number;
  setelahThawingKg: number;
  susutJualKg: number;
  totalSusutBeratKg: number;
  shrinkageRatePercent: number;
  shrinkageRateFormatted: string;
}

/**
 * Calculates Total Shrinkage Rate (%) and Shrinkage Loss Weight (kg)
 *
 * Business Formula:
 * 1. Total Susut Berat (kg) = Bahan_Awal_kg - (setelah_thawing_kg - abs(Susut_Jual_kg))
 *                           = Bahan_Awal_kg - setelah_thawing_kg + abs(Susut_Jual_kg)
 * 2. Shrinkage_Rate (%)     = (Total_Susut_Berat_kg / Bahan_Awal_kg) * 100
 *
 * Division by Zero Protection: If Bahan_Awal_kg <= 0, returns 0.00%
 * Formatting: 2 decimal places (e.g., 2.14%)
 */
export function calculateTotalShrinkage(
  bahanAwalKg: number,
  setelahThawingKg: number,
  susutJualKg: number = 0
): ShrinkageCalculationResult {
  const safeBahanAwal = Math.max(0, bahanAwalKg || 0);
  const safeSetelahThawing = Math.max(0, setelahThawingKg || 0);
  const safeSusutJual = Math.abs(susutJualKg || 0);

  // Safe division by zero prevention
  if (safeBahanAwal <= 0) {
    return {
      bahanAwalKg: 0,
      setelahThawingKg: 0,
      susutJualKg: 0,
      totalSusutBeratKg: 0,
      shrinkageRatePercent: 0,
      shrinkageRateFormatted: '0.00%',
    };
  }

  // Formula: Bahan_Awal - (setelah_Thawing - abs(Susut_Jual))
  const totalSusutBeratKg = safeBahanAwal - (safeSetelahThawing - safeSusutJual);
  const shrinkageRatePercent = (totalSusutBeratKg / safeBahanAwal) * 100;

  const roundedLossKg = Math.round(totalSusutBeratKg * 1000) / 1000;
  const roundedPercent = Math.round(shrinkageRatePercent * 100) / 100;

  return {
    bahanAwalKg: safeBahanAwal,
    setelahThawingKg: safeSetelahThawing,
    susutJualKg: safeSusutJual,
    totalSusutBeratKg: roundedLossKg,
    shrinkageRatePercent: roundedPercent,
    shrinkageRateFormatted: `${roundedPercent.toFixed(2)}%`,
  };
}

// Standard Cut Segmentation Categories
export const STANDARD_CUT_SEGMENTS = [
  'Prime Cuts',
  'Secondary Cuts',
  'Tertiary Cuts',
  'Trimming',
] as const;

// Default Kategori Bahan - Operational Yield Analytics
export const DEFAULT_MATERIAL_CATEGORIES = [
  'Prime Cuts',
  'Secondary Cuts',
  'Tertiary Cuts',
  'Trimming',
];

// Default Pabrikasi / Cut Names (Mapped into Prime, Secondary, Tertiary, Trimming)
export const DEFAULT_PABRIKASI_NAMES = [
  'Tenderloin / Has Dalam (Prime Cuts)',
  'Sirloin / Has Luar (Prime Cuts)',
  'Ribeye / Lamusir (Prime Cuts)',
  'Chuck / Knuckle Paha (Secondary Cuts)',
  'Topside / Gandik (Secondary Cuts)',
  'Brisket Sandung Lamur (Secondary Cuts)',
  'Sengkel / Shankle (Tertiary Cuts)',
  'Iga / Short Ribs (Tertiary Cuts)',
  'Rawon / Oxtail Sup (Tertiary Cuts)',
  'Tetelan / Daging Giling (Trimming)',
  'Fat & Trimming / Lemak (Trimming)',
];

// Default Raw Material Items (General Meat cuts with Brands, Codes, and Standard Cut Category)
export const DEFAULT_NAMA_BAHAN_LIST = [
  { name: 'Daging Sapi Tenderloin (Has Dalam)', code: 'DGS-01', defaultBrand: 'Santori', cutCategory: 'Prime Cuts', category: 'Prime Cuts', plan: 'Tenderloin / Has Dalam (Prime Cuts)' },
  { name: 'Daging Sapi Sirloin (Has Luar)', code: 'DGS-02', defaultBrand: 'Swift', cutCategory: 'Prime Cuts', category: 'Prime Cuts', plan: 'Sirloin / Has Luar (Prime Cuts)' },
  { name: 'Daging Sapi Ribeye (Lamusir)', code: 'DGS-03', defaultBrand: 'Teys', cutCategory: 'Prime Cuts', category: 'Prime Cuts', plan: 'Ribeye / Lamusir (Prime Cuts)' },
  { name: 'Daging Sapi Paha (Chuck / Knuckle)', code: 'DGS-04', defaultBrand: 'Swift', cutCategory: 'Secondary Cuts', category: 'Secondary Cuts', plan: 'Chuck / Knuckle Paha (Secondary Cuts)' },
  { name: 'Daging Sapi Sandung Lamur (Brisket)', code: 'DGS-05', defaultBrand: 'Kilcoy', cutCategory: 'Secondary Cuts', category: 'Secondary Cuts', plan: 'Brisket Sandung Lamur (Secondary Cuts)' },
  { name: 'Daging Sapi Topside / Gandik', code: 'DGS-06', defaultBrand: 'Teys', cutCategory: 'Secondary Cuts', category: 'Secondary Cuts', plan: 'Topside / Gandik (Secondary Cuts)' },
  { name: 'Daging Sapi Sengkel (Shankle)', code: 'DGS-07', defaultBrand: 'Kilcoy', cutCategory: 'Tertiary Cuts', category: 'Tertiary Cuts', plan: 'Sengkel / Shankle (Tertiary Cuts)' },
  { name: 'Daging Sapi Iga (Short Ribs)', code: 'DGS-08', defaultBrand: 'Lokal', cutCategory: 'Tertiary Cuts', category: 'Tertiary Cuts', plan: 'Iga / Short Ribs (Tertiary Cuts)' },
  { name: 'Daging Sapi Buntut & Rawon Curah', code: 'DGS-09', defaultBrand: 'Lokal', cutCategory: 'Tertiary Cuts', category: 'Tertiary Cuts', plan: 'Rawon / Oxtail Sup (Tertiary Cuts)' },
  { name: 'Daging Sapi Tetelan & Trimming', code: 'DGS-10', defaultBrand: 'Lokal', cutCategory: 'Trimming', category: 'Trimming', plan: 'Tetelan / Daging Giling (Trimming)' },
  { name: 'Daging Sapi Giling Minced Beef', code: 'DGS-11', defaultBrand: 'Lokal', cutCategory: 'Trimming', category: 'Trimming', plan: 'Tetelan / Daging Giling (Trimming)' },
];

// Kept for backwards compatibility
export const DEFAULT_PABRIKASI_CATEGORIES = DEFAULT_MATERIAL_CATEGORIES;

export interface RencanaPotonganBreakdown {
  planName: string;
  itemCount: number;
  totalBahanAwalKg: number;
  totalSetelahThawingKg: number;
  totalSusutJualKg: number;
  totalSusutBeratKg: number;
  shrinkageRatePercent: number;
  shrinkageRateFormatted: string;
  items: ThawingItem[];
}

export interface RencanaPotongShrinkageSummary {
  planName: string;
  items: ThawingItem[];
  itemCount: number;
  totalBahanSebelumThawingKg: number;
  totalBahanSetelahThawingKg: number;
  selisihProsesKg: number;
  susutJualKg: number;
  totalSusutKg: number;
  shrinkageRatePercent: number;
  shrinkageRateFormatted: string;
  isAlertExceeded: boolean;
}

export function aggregateShrinkageByRencanaPotong(
  items: ThawingItem[],
  customPlans?: string[],
  segments?: FabricationSegment[]
): {
  planSummaries: RencanaPotongShrinkageSummary[];
  grandTotal: {
    totalBahanSebelumThawingKg: number;
    totalBahanSetelahThawingKg: number;
    selisihProsesKg: number;
    susutJualKg: number;
    totalSusutKg: number;
    shrinkageRatePercent: number;
    shrinkageRateFormatted: string;
    isAlertExceeded: boolean;
  };
} {
  const defaultPlans = [
    'DAGING RENDANG PREMIUM',
    'RENDANG POT FRESH',
    'RENDANG SHANKLE',
    'RAWON FRESH',
    'RAWON',
  ];

  const userCustomPlans = Array.isArray(customPlans) ? customPlans : [];
  const itemPlans = items.map((i) => i.plannedFabrication).filter(Boolean);
  const segmentPlans = (segments || []).map((s) => s.plannedFabrication).filter(Boolean) as string[];

  const allPlanNames = Array.from(
    new Set([
      ...defaultPlans,
      ...userCustomPlans.map((p) => String(p || '').trim().toUpperCase()),
      ...itemPlans.map((p) => String(p || '').trim().toUpperCase()),
      ...segmentPlans.map((p) => String(p || '').trim().toUpperCase()),
    ])
  ).filter(Boolean);

  const planSummaries: RencanaPotongShrinkageSummary[] = allPlanNames.map((planName) => {
    const safePlanName = String(planName || '').trim().toUpperCase();
    const planItems = items.filter(
      (item) => String(item.plannedFabrication || '').trim().toUpperCase() === safePlanName
    );

    const planSegments = (segments || []).filter((seg) => {
      const parent = items.find((i) => i.id === seg.itemId);
      const p = String(seg.plannedFabrication || parent?.plannedFabrication || '').trim().toUpperCase();
      return p === safePlanName;
    });

    const totalSebelum = planItems.reduce((acc, i) => acc + (i.weightBeforeThawing || 0), 0);
    const totalSetelah = planItems.reduce(
      (acc, i) => acc + (i.weightAfterThawing !== undefined ? i.weightAfterThawing : i.weightBeforeThawing),
      0
    );

    // Calculate Susut Jual (Update Susut)
    // Combine item's susutJualKg with segment's periodicShrinkage
    let susutJual = 0;
    if (planItems.length > 0) {
      planItems.forEach((item) => {
        const itemSegs = planSegments.filter((s) => s.itemId === item.id);
        const segSum = itemSegs.reduce((acc, s) => acc + (s.periodicShrinkage || 0), 0);
        const itemSusut = Math.max(item.susutJualKg || 0, segSum);
        susutJual += itemSusut;
      });
      // Add any segments for this plan whose parent item is not in planItems
      const orphanSegments = planSegments.filter((s) => !planItems.some((i) => i.id === s.itemId));
      susutJual += orphanSegments.reduce((acc, s) => acc + (s.periodicShrinkage || 0), 0);
    } else {
      const itemSum = planItems.reduce((acc, i) => acc + (i.susutJualKg || 0), 0);
      const segSum = planSegments.reduce((acc, s) => acc + (s.periodicShrinkage || 0), 0);
      susutJual = Math.max(itemSum, segSum);
    }

    const processLoss = totalSebelum - totalSetelah;
    const selisihProsesKg = -processLoss;
    const totalSusutKg = Math.max(0, processLoss) + Math.abs(susutJual);
    const ratePercent = totalSebelum > 0 ? (totalSusutKg / totalSebelum) * 100 : 0;
    const roundedRate = Math.round(ratePercent * 100) / 100;

    return {
      planName,
      items: planItems,
      itemCount: planItems.length,
      totalBahanSebelumThawingKg: totalSebelum,
      totalBahanSetelahThawingKg: totalSetelah,
      selisihProsesKg,
      susutJualKg: susutJual,
      totalSusutKg,
      shrinkageRatePercent: roundedRate,
      shrinkageRateFormatted: `${roundedRate.toFixed(2)}%`,
      isAlertExceeded: roundedRate > 2.0,
    };
  });

  const grandSebelum = items.reduce((acc, i) => acc + (i.weightBeforeThawing || 0), 0);
  const grandSetelah = items.reduce(
    (acc, i) => acc + (i.weightAfterThawing !== undefined ? i.weightAfterThawing : i.weightBeforeThawing),
    0
  );

  const grandSusutJual = planSummaries.reduce((acc, p) => acc + p.susutJualKg, 0);

  const grandProcessLoss = grandSebelum - grandSetelah;
  const grandSelisih = -grandProcessLoss;
  const grandTotalSusutKg = Math.max(0, grandProcessLoss) + Math.abs(grandSusutJual);
  const grandRatePercent = grandSebelum > 0 ? (grandTotalSusutKg / grandSebelum) * 100 : 0;
  const grandRoundedRate = Math.round(grandRatePercent * 100) / 100;

  return {
    planSummaries,
    grandTotal: {
      totalBahanSebelumThawingKg: grandSebelum,
      totalBahanSetelahThawingKg: grandSetelah,
      selisihProsesKg: grandSelisih,
      susutJualKg: grandSusutJual,
      totalSusutKg: grandTotalSusutKg,
      shrinkageRatePercent: grandRoundedRate,
      shrinkageRateFormatted: `${grandRoundedRate.toFixed(2)}%`,
      isAlertExceeded: grandRoundedRate > 2.0,
    },
  };
}

export interface PabrikasiCategorySummary {
  categoryName: string;
  totalBahanAwalKg: number;
  totalSetelahThawingKg: number;
  totalSusutJualKg: number;
  selisihProsesKg: number;
  totalSusutBeratKg: number;
  shrinkageRatePercent: number;
  shrinkageRateFormatted: string;
  isAlertExceeded: boolean;
  itemCount: number;
  items: ThawingItem[];
  rencanaBreakdown: RencanaPotonganBreakdown[];
}

/**
 * Aggregates Thawing Items by Material Category and computes accumulated total shrinkage per category
 */
export function aggregateShrinkageByPabrikasi(
  items: ThawingItem[],
  customCategories?: string[],
  segments?: FabricationSegment[]
): PabrikasiCategorySummary[] {
  const catList = Array.isArray(customCategories)
    ? customCategories
    : DEFAULT_MATERIAL_CATEGORIES;

  const validCategories = Array.from(
    new Set(
      catList.filter(
        (c) =>
          c &&
          !['DAGING PRESH', 'D.R. FRESH MEMBER', 'DR FRESH MEMBER'].includes(
            c.toUpperCase()
          )
      )
    )
  );

  return validCategories.map((catName) => {
    // Filter items belonging to this category (normalizing DAGING PRESH to DAGING FRESH, RAWON FRESH to RAWON)
    const categoryItems = items.filter((item) => {
      const cat = (item.pabrikasiCategory || 'DAGING FRESH').toUpperCase();
      if (catName.toUpperCase() === 'DAGING FRESH') {
        return cat === 'DAGING FRESH' || cat === 'DAGING PRESH';
      }
      if (catName.toUpperCase() === 'RAWON' || catName.toUpperCase() === 'RAWON FRESH') {
        return cat === 'RAWON' || cat === 'RAWON FRESH';
      }
      return cat === catName.toUpperCase();
    });

    const totalBahanAwalKg = categoryItems.reduce((acc, item) => acc + (item.weightBeforeThawing || 0), 0);
    const totalSetelahThawingKg = categoryItems.reduce(
      (acc, item) => acc + (item.weightAfterThawing !== undefined ? item.weightAfterThawing : item.weightBeforeThawing),
      0
    );

    // Calculate Susut Jual per category (combine item susutJualKg and segment periodicShrinkage)
    let totalSusutJualKg = categoryItems.reduce((acc, item) => acc + (item.susutJualKg || 0), 0);
    if (segments && segments.length > 0) {
      let segSusut = 0;
      categoryItems.forEach((item) => {
        const itemSegs = segments.filter((s) => s.itemId === item.id);
        const segSum = itemSegs.reduce((acc, s) => acc + (s.periodicShrinkage || 0), 0);
        segSusut += Math.max(item.susutJualKg || 0, segSum);
      });
      totalSusutJualKg = Math.max(totalSusutJualKg, segSusut);
    }

    const calc = calculateTotalShrinkage(totalBahanAwalKg, totalSetelahThawingKg, totalSusutJualKg);
    const processLoss = totalBahanAwalKg - totalSetelahThawingKg;
    const selisihProsesKg = -processLoss;

    // Default plans associated with this category
    const defaultPlansForCat = DEFAULT_NAMA_BAHAN_LIST
      .filter((b) => b.category.toUpperCase() === catName.toUpperCase() || (catName.toUpperCase() === 'DAGING FRESH' && b.category.toUpperCase() === 'DAGING PRESH'))
      .map((b) => b.plan);

    const allPlanNames = Array.from(
      new Set([
        ...categoryItems.map((item) => String(item.plannedFabrication || '').trim().toUpperCase()).filter(Boolean),
        ...defaultPlansForCat.map((p) => String(p || '').trim().toUpperCase()),
      ])
    ).filter(Boolean);

    const rencanaBreakdown: RencanaPotonganBreakdown[] = allPlanNames.map((planName) => {
      const safePlanName = String(planName || '').trim().toUpperCase();
      const planItems = categoryItems.filter(
        (item) => String(item.plannedFabrication || '').trim().toUpperCase() === safePlanName
      );
      const planBahanAwal = planItems.reduce((acc, i) => acc + (i.weightBeforeThawing || 0), 0);
      const planSetelahThaw = planItems.reduce(
        (acc, i) => acc + (i.weightAfterThawing !== undefined ? i.weightAfterThawing : i.weightBeforeThawing),
        0
      );
      const planSusutJual = planItems.reduce((acc, i) => acc + (i.susutJualKg || 0), 0);
      const planCalc = calculateTotalShrinkage(planBahanAwal, planSetelahThaw, planSusutJual);

      return {
        planName,
        itemCount: planItems.length,
        totalBahanAwalKg: planCalc.bahanAwalKg,
        totalSetelahThawingKg: planCalc.setelahThawingKg,
        totalSusutJualKg: planCalc.susutJualKg,
        totalSusutBeratKg: planCalc.totalSusutBeratKg,
        shrinkageRatePercent: planCalc.shrinkageRatePercent,
        shrinkageRateFormatted: planCalc.shrinkageRateFormatted,
        items: planItems,
      };
    });

    return {
      categoryName: catName,
      totalBahanAwalKg: calc.bahanAwalKg,
      totalSetelahThawingKg: calc.setelahThawingKg,
      totalSusutJualKg: calc.susutJualKg,
      selisihProsesKg,
      totalSusutBeratKg: calc.totalSusutBeratKg,
      shrinkageRatePercent: calc.shrinkageRatePercent,
      shrinkageRateFormatted: calc.shrinkageRateFormatted,
      isAlertExceeded: calc.shrinkageRatePercent > 2.0,
      itemCount: categoryItems.length,
      items: categoryItems,
      rencanaBreakdown,
    };
  });
}
