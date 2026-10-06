import { ThawingItem, FabricationSegment, HppPricingRecord } from '../types';

export interface BrandQualityMetric {
  brand: string;
  sampleCount: number;
  totalRawKg: number;
  totalThawedKg: number;
  averageShrinkagePercent: number;
  effectiveYieldPercent: number;
  qualityGrade: string;
}

export interface PythonYieldAnalyticsResult {
  status: string;
  engine: string;
  timestamp: string;
  thawingAnalytics: {
    samplesProcessed: number;
    totalRawKg: number;
    totalThawedKg: number;
    totalLossKg: number;
    activeShrinkagePercent: number;
    rolling3AveragePercent: number;
    rolling7AveragePercent: number;
    overallAveragePercent: number;
    effectiveYieldPercent: number;
    efficiencyStatus: 'OPTIMAL' | 'WARNING' | 'CRITICAL';
    riskLevel: string;
  };
  pricingAnalytics: {
    purchasePricePerKg: number;
    operationalCostPerKg: number;
    nominalCostPerKg: number;
    realHppPerKg: number;
    hiddenLossPerKg: number;
    targetMarginPercent: number;
    minSellingPricePerKg: number;
    recommendedSellingPricePerKg: number;
  };
  cutSegmentationBreakdown: {
    cutCategory: 'Prime Cuts' | 'Secondary Cuts' | 'Tertiary Cuts' | 'Trimming';
    totalWeightKg: number;
    salesKg: number;
    portionPercent: number;
    count: number;
  }[];
  brandQualityRankings: BrandQualityMetric[];
  batchSummaries: {
    batchId: string;
    batchPurpose: string;
    batchStatus: string;
    itemCount: number;
    totalRawKg: number;
    totalThawedKg: number;
    totalLossKg: number;
  }[];
}

export interface RollingShrinkageAnalysis {
  sampleCount: number;
  rolling3AveragePercent: number;
  rolling7AveragePercent: number;
  overallAveragePercent: number;
  latestBatchShrinkagePercent: number;
  selectedRollingShrinkagePercent: number;
  efficiencyStatus: 'OPTIMAL' | 'WASPADA' | 'KRITIS';
  statusMessage: string;
  statusColor: string;
  isEfficiencyDropping: boolean;
  recentBatches: {
    id: string;
    itemName: string;
    brand?: string;
    itemCode?: string;
    batchId?: string;
    batchPurpose?: string;
    weightBefore: number;
    weightAfter: number;
    shrinkageKg: number;
    shrinkagePercent: number;
    date: string;
    time: string;
  }[];
}

export interface HppCalculationResult {
  purchasePricePerKg: number;
  rollingShrinkagePercent: number;
  yieldPercent: number;
  yieldRatio: number;
  operationalCostPerKg: number;
  rawMaterialCostAdjusted: number;
  realHppPerKg: number;
  hiddenLossPerKg: number;
  targetMarginPercent: number;
  minSellingPricePerKg: number;
  rawMinSellingPrice: number;
  previousSellingPrice?: number;
  realizedMarginPercent?: number;
  marginErodedPercent?: number;
  isMarginAtRisk: boolean;
  recommendationAction: string;
}

/**
 * Panggil Python Analytics Backend (/api/python/yield-analytics)
 */
export async function runPythonYieldAnalytics(payload: {
  items: ThawingItem[];
  segments: FabricationSegment[];
  targetMarginPercent?: number;
  purchasePricePerKg?: number;
  operationalCostPerKg?: number;
}): Promise<PythonYieldAnalyticsResult | null> {
  try {
    const res = await fetch('/api/python/yield-analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Python engine API call fallback to client computation:', err);
  }
  return null;
}

/**
 * Hitung Brand Quality Ranking dari histori Thawing
 */
export function calculateBrandQualityRankings(items: ThawingItem[]): BrandQualityMetric[] {
  const completed = items.filter(
    (i) => !i.isCarryover && i.weightBeforeThawing > 0 && i.weightAfterThawing !== undefined
  );

  const brandMap = new Map<string, { raw: number; thawed: number; count: number; lossRates: number[] }>();

  completed.forEach((it) => {
    const brand = it.brand?.trim() || 'General / Unspecified';
    const raw = Number(it.weightBeforeThawing) || 0;
    const thawed = Number(it.weightAfterThawing) || raw;
    const lossKg = Math.max(0, raw - thawed);
    const lossPct = raw > 0 ? (lossKg / raw) * 100 : 0;

    const cur = brandMap.get(brand) || { raw: 0, thawed: 0, count: 0, lossRates: [] };
    cur.raw += raw;
    cur.thawed += thawed;
    cur.count += 1;
    cur.lossRates.push(lossPct);
    brandMap.set(brand, cur);
  });

  const results: BrandQualityMetric[] = [];
  brandMap.forEach((val, brand) => {
    const avgLoss = val.lossRates.length > 0 ? val.lossRates.reduce((a, b) => a + b, 0) / val.lossRates.length : 0;
    const yieldPct = Math.max(0, 100 - avgLoss);

    let qualityGrade = 'Grade B (Standard Yield)';
    if (avgLoss <= 2.0) qualityGrade = 'Grade A (Optimal Yield)';
    else if (avgLoss > 3.5) qualityGrade = 'Grade C (High Shrinkage)';

    results.push({
      brand,
      sampleCount: val.count,
      totalRawKg: parseFloat(val.raw.toFixed(3)),
      totalThawedKg: parseFloat(val.thawed.toFixed(3)),
      averageShrinkagePercent: parseFloat(avgLoss.toFixed(2)),
      effectiveYieldPercent: parseFloat(yieldPct.toFixed(2)),
      qualityGrade,
    });
  });

  return results.sort((a, b) => a.averageShrinkagePercent - b.averageShrinkagePercent);
}

/**
 * Hitung Rata-rata Susut Bergerak (Rolling Shrinkage Average)
 */
export function calculateRollingShrinkage(
  items: ThawingItem[],
  filterItemName?: string,
  filterBrand?: string
): RollingShrinkageAnalysis {
  let finishedItems = items.filter(
    (item) =>
      !item.isCarryover &&
      item.weightBeforeThawing > 0 &&
      item.weightAfterThawing !== undefined &&
      item.weightAfterThawing >= 0
  );

  if (filterItemName && filterItemName.trim()) {
    const term = filterItemName.toLowerCase().trim();
    const itemMatches = finishedItems.filter((i) =>
      i.name.toLowerCase().includes(term) || term.includes(i.name.toLowerCase())
    );
    if (itemMatches.length > 0) finishedItems = itemMatches;
  }

  if (filterBrand && filterBrand.trim()) {
    const brandTerm = filterBrand.toLowerCase().trim();
    const brandMatches = finishedItems.filter((i) =>
      (i.brand || '').toLowerCase().includes(brandTerm)
    );
    if (brandMatches.length > 0) finishedItems = brandMatches;
  }

  const sorted = [...finishedItems].sort((a, b) => {
    const tA = new Date(a.thawingEndTime || a.createdAt || 0).getTime();
    const tB = new Date(b.thawingEndTime || b.createdAt || 0).getTime();
    return tB - tA;
  });

  const batches = sorted.map((item) => {
    const wBefore = Number(item.weightBeforeThawing) || 0;
    const wAfter = Number(item.weightAfterThawing) || 0;
    const lossKg = Math.max(0, wBefore - wAfter);
    const lossPct = wBefore > 0 ? (lossKg / wBefore) * 100 : 0;
    const rawTime = item.thawingEndTime || item.thawingStartTime || item.createdAt || '';
    const dateStr = rawTime.split('T')[0] || new Date().toISOString().split('T')[0];
    const timeStr = rawTime.includes('T') ? rawTime.split('T')[1].substring(0, 5) : '08:00';

    return {
      id: item.id,
      itemName: item.name,
      brand: item.brand,
      itemCode: item.itemCode,
      batchId: item.batchId,
      batchPurpose: item.batchPurpose || item.openingPurpose,
      weightBefore: wBefore,
      weightAfter: wAfter,
      shrinkageKg: parseFloat(lossKg.toFixed(3)),
      shrinkagePercent: parseFloat(lossPct.toFixed(2)),
      date: dateStr,
      time: timeStr,
    };
  });

  const sampleCount = batches.length;

  if (sampleCount === 0) {
    return {
      sampleCount: 0,
      rolling3AveragePercent: 2.0,
      rolling7AveragePercent: 2.0,
      overallAveragePercent: 2.0,
      latestBatchShrinkagePercent: 2.0,
      selectedRollingShrinkagePercent: 2.0,
      efficiencyStatus: 'OPTIMAL',
      statusMessage: 'Baseline Standar Fasilitas (Belum ada riwayat batch hari ini)',
      statusColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      isEfficiencyDropping: false,
      recentBatches: [],
    };
  }

  const last3 = batches.slice(0, Math.min(3, sampleCount));
  const totalBahan3 = last3.reduce((acc, b) => acc + b.weightBefore, 0);
  const totalLoss3 = last3.reduce((acc, b) => acc + b.shrinkageKg, 0);
  const rolling3 = totalBahan3 > 0 ? (totalLoss3 / totalBahan3) * 100 : last3[0].shrinkagePercent;

  const last7 = batches.slice(0, Math.min(7, sampleCount));
  const totalBahan7 = last7.reduce((acc, b) => acc + b.weightBefore, 0);
  const totalLoss7 = last7.reduce((acc, b) => acc + b.shrinkageKg, 0);
  const rolling7 = totalBahan7 > 0 ? (totalLoss7 / totalBahan7) * 100 : rolling3;

  const totalBahanAll = batches.reduce((acc, b) => acc + b.weightBefore, 0);
  const totalLossAll = batches.reduce((acc, b) => acc + b.shrinkageKg, 0);
  const overall = totalBahanAll > 0 ? (totalLossAll / totalBahanAll) * 100 : rolling7;

  const latest = batches[0].shrinkagePercent;
  const selected = parseFloat((sampleCount >= 2 ? rolling3 : overall).toFixed(2));

  let efficiencyStatus: 'OPTIMAL' | 'WASPADA' | 'KRITIS' = 'OPTIMAL';
  let statusMessage = 'Efisiensi Thawing Bagus (Rendemen Tinggi & Stabil)';
  let statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-300';
  let isEfficiencyDropping = false;

  if (selected > 3.5 || (sampleCount >= 2 && rolling3 > 3.5 && rolling3 > rolling7 * 1.2)) {
    efficiencyStatus = 'KRITIS';
    statusMessage = '⚠️ KRITIS: Efisiensi Thawing Menurun! Drip loss tinggi, rekomendasi harga naik untuk amankan margin.';
    statusColor = 'text-red-700 bg-red-50 border-red-300 animate-pulse';
    isEfficiencyDropping = true;
  } else if (selected > 2.2 || (sampleCount >= 2 && rolling3 > rolling7 * 1.1)) {
    efficiencyStatus = 'WASPADA';
    statusMessage = '⚡ WASPADA: Terjadi Peningkatan Susut Thawing. Disarankan penyesuaian harga jual minimum.';
    statusColor = 'text-amber-800 bg-amber-50 border-amber-300';
    isEfficiencyDropping = true;
  }

  return {
    sampleCount,
    rolling3AveragePercent: parseFloat(rolling3.toFixed(2)),
    rolling7AveragePercent: parseFloat(rolling7.toFixed(2)),
    overallAveragePercent: parseFloat(overall.toFixed(2)),
    latestBatchShrinkagePercent: parseFloat(latest.toFixed(2)),
    selectedRollingShrinkagePercent: selected,
    efficiencyStatus,
    statusMessage,
    statusColor,
    isEfficiencyDropping,
    recentBatches: batches.slice(0, 10),
  };
}

/**
 * Hitung HPP Otomatis Terintegrasi Susut Bergerak & Rekomendasi Harga Jual Minimum
 */
export function calculateAutomatedHpp(params: {
  purchasePricePerKg: number;
  rollingShrinkagePercent: number;
  operationalCostPerKg?: number;
  targetMarginPercent?: number;
  previousSellingPrice?: number;
}): HppCalculationResult {
  const purchasePrice = Math.max(0, Number(params.purchasePricePerKg) || 0);
  const shrinkagePercent = Math.min(95, Math.max(0, Number(params.rollingShrinkagePercent) || 0));
  const opCost = Math.max(0, Number(params.operationalCostPerKg ?? 2500) || 0);
  const targetMargin = Math.min(90, Math.max(1, Number(params.targetMarginPercent ?? 20) || 20));
  const prevPrice = params.previousSellingPrice ? Number(params.previousSellingPrice) : undefined;

  const yieldPercent = Math.max(5, 100 - shrinkagePercent);
  const yieldRatio = yieldPercent / 100;

  const rawMaterialCostAdjusted = yieldRatio > 0 ? purchasePrice / yieldRatio : purchasePrice;
  const realHppPerKg = rawMaterialCostAdjusted + opCost;

  const standardCostWithoutShrinkage = purchasePrice + opCost;
  const hiddenLossPerKg = Math.max(0, realHppPerKg - standardCostWithoutShrinkage);

  const marginRatio = (100 - targetMargin) / 100;
  const rawMinSellingPrice = marginRatio > 0 ? realHppPerKg / marginRatio : realHppPerKg * 1.25;
  const minSellingPricePerKg = Math.ceil(rawMinSellingPrice / 500) * 500;

  let realizedMarginPercent: number | undefined;
  let marginErodedPercent: number | undefined;
  let isMarginAtRisk = false;
  let recommendationAction = `Tetapkan harga jual minimum di Rp ${minSellingPricePerKg.toLocaleString('id-ID')} / Kg untuk mengunci margin target ${targetMargin}%.`;

  if (prevPrice && prevPrice > 0) {
    realizedMarginPercent = ((prevPrice - realHppPerKg) / prevPrice) * 100;
    marginErodedPercent = targetMargin - realizedMarginPercent;

    if (realizedMarginPercent < targetMargin) {
      isMarginAtRisk = true;
      if (realizedMarginPercent <= 0) {
        recommendationAction = `🚨 BAHAYA RUGI: Harga lama Rp ${prevPrice.toLocaleString('id-ID')} berada di bawah HPP riil! Segera naikkan ke minimal Rp ${minSellingPricePerKg.toLocaleString('id-ID')} / Kg!`;
      } else {
        const deltaPrice = Math.max(0, minSellingPricePerKg - prevPrice);
        recommendationAction = `⚠️ MARGIN TERGERUS: Margin tersisa ${realizedMarginPercent.toFixed(1)}% (turun ${marginErodedPercent.toFixed(1)}% dari target). Rekomendasi tim pricing: Naikkan harga minimal +Rp ${deltaPrice.toLocaleString('id-ID')} ke Rp ${minSellingPricePerKg.toLocaleString('id-ID')} / Kg.`;
      }
    }
  }

  return {
    purchasePricePerKg: purchasePrice,
    rollingShrinkagePercent: parseFloat(shrinkagePercent.toFixed(2)),
    yieldPercent: parseFloat(yieldPercent.toFixed(2)),
    yieldRatio: parseFloat(yieldRatio.toFixed(4)),
    operationalCostPerKg: opCost,
    rawMaterialCostAdjusted: Math.round(rawMaterialCostAdjusted),
    realHppPerKg: Math.round(realHppPerKg),
    hiddenLossPerKg: Math.round(hiddenLossPerKg),
    targetMarginPercent: targetMargin,
    minSellingPricePerKg,
    rawMinSellingPrice: Math.round(rawMinSellingPrice),
    previousSellingPrice: prevPrice,
    realizedMarginPercent: realizedMarginPercent !== undefined ? parseFloat(realizedMarginPercent.toFixed(1)) : undefined,
    marginErodedPercent: marginErodedPercent !== undefined ? parseFloat(marginErodedPercent.toFixed(1)) : undefined,
    isMarginAtRisk,
    recommendationAction,
  };
}

// Local persistence for HPP records
const HPP_STORAGE_KEY = 'operational_yield_hpp_records';

export function getStoredHppRecords(): HppPricingRecord[] {
  try {
    const raw = localStorage.getItem(HPP_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHppPricingRecord(record: HppPricingRecord): HppPricingRecord[] {
  try {
    const list = getStoredHppRecords();
    const existingIdx = list.findIndex((r) => r.id === record.id);
    let updated: HppPricingRecord[];
    if (existingIdx >= 0) {
      updated = [...list];
      updated[existingIdx] = record;
    } else {
      updated = [record, ...list];
    }
    localStorage.setItem(HPP_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function deleteHppPricingRecord(id: string): HppPricingRecord[] {
  try {
    const list = getStoredHppRecords();
    const updated = list.filter((r) => r.id !== id);
    localStorage.setItem(HPP_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}
