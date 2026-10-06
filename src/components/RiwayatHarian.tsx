import React, { useState, useMemo } from 'react';
import {
  ThawingItem,
  FabricationSegment,
  DailyClosingReport,
  ReportPhotoAttachment,
  ClosingPlanRecord,
  StockAdjustment,
  CogsMaster,
} from '../types';
import { exportStoreDailyLaporanExcel, exportStoreDailyLaporanCSV } from '../utils/excelExport';
import {
  FileSpreadsheet,
  Download,
  Clock,
  Scale,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Camera,
  Layers,
  Award,
  Calendar,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Tag,
  Maximize2,
  X,
  Trash2,
} from 'lucide-react';

interface RiwayatHarianProps {
  items: ThawingItem[];
  segments: FabricationSegment[];
  reports?: DailyClosingReport[];
  closingRecords?: ClosingPlanRecord[];
  adjustments?: StockAdjustment[];
  cogsList?: CogsMaster[];
  onCloseDay?: (closedReport: DailyClosingReport) => void;
  onDeleteReport?: (id: string) => void;
  onNavigateToClosing?: () => void;
}

const KNOWN_BRANDS = ['Swift', 'Teys', 'Kilcoy', 'Santori', 'Lokal'];
const CUT_CATEGORIES = ['Prime Cuts', 'Secondary Cuts', 'Tertiary Cuts', 'Trimming'] as const;

export default function RiwayatHarian({
  items = [],
  segments = [],
  reports = [],
  closingRecords = [],
  adjustments = [],
  cogsList = [],
  onNavigateToClosing,
}: RiwayatHarianProps) {
  // Tab view selection
  const [activeTab, setActiveTab] = useState<'SEGMENTASI' | 'MERK' | 'BATCH' | 'DOKUMENTASI'>('SEGMENTASI');

  // Selected date filter
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Lightbox modal state
  const [previewPhoto, setPreviewPhoto] = useState<ReportPhotoAttachment | null>(null);

  // Filtered operational datasets by date
  const dateItems = useMemo(() => {
    return items.filter((i) => (i.thawingDate || i.createdAt || '').startsWith(selectedDate));
  }, [items, selectedDate]);

  const dateSegments = useMemo(() => {
    return segments.filter((s) => (s.createdAt || '').startsWith(selectedDate));
  }, [segments, selectedDate]);

  const dateClosingRecords = useMemo(() => {
    return closingRecords.filter((c) => (c.date || c.timestamp || '').startsWith(selectedDate));
  }, [closingRecords, selectedDate]);

  // Overall KPIs for the day
  const totalRawKg = dateItems.reduce((acc, i) => acc + (Number(i.weightBeforeThawing) || 0), 0);
  const totalThawedKg = dateItems.reduce((acc, i) => acc + (Number(i.weightAfterThawing) || Number(i.weightBeforeThawing) || 0), 0);
  const totalShrinkageKg = Math.max(0, totalRawKg - totalThawedKg);
  const overallShrinkagePct = totalRawKg > 0 ? (totalShrinkageKg / totalRawKg) * 100 : 0;
  const overallYieldPct = Math.max(0, 100 - overallShrinkagePct);

  // 1. ANALYSIS BY CUT SEGMENTATION (Prime Cuts, Secondary Cuts, Tertiary Cuts, Trimming)
  const cutAnalysis = useMemo(() => {
    const totalCutWeight = dateSegments.reduce((a, s) => a + (Number(s.actualWeight) || 0), 0);

    return CUT_CATEGORIES.map((cutName) => {
      const matchSegments = dateSegments.filter(
        (s) => (s.cutCategory || '').toLowerCase().includes(cutName.toLowerCase().split(' ')[0])
      );
      const weight = matchSegments.reduce((a, s) => a + (Number(s.actualWeight) || 0), 0);
      const sales = matchSegments.reduce((a, s) => a + (Number(s.salesKg) || 0), 0);
      const sharePct = totalCutWeight > 0 ? (weight / totalCutWeight) * 100 : 0;
      const remainingStock = Math.max(0, weight - sales);

      return {
        cutCategory: cutName,
        totalWeightKg: weight,
        salesKg: sales,
        remainingStockKg: remainingStock,
        sharePercent: sharePct,
        segmentCount: matchSegments.length,
        items: matchSegments,
      };
    });
  }, [dateSegments]);

  // 2. ANALYSIS BY BRAND (Swift, Teys, Kilcoy, Santori, Lokal) FOR RAW INGREDIENT QUALITY
  const brandAnalysis = useMemo(() => {
    const map = new Map<string, { raw: number; thawed: number; loss: number; count: number; items: ThawingItem[] }>();

    // Initialize with known brands so they appear nicely
    KNOWN_BRANDS.forEach((b) => {
      map.set(b, { raw: 0, thawed: 0, loss: 0, count: 0, items: [] });
    });

    dateItems.forEach((it) => {
      const b = it.brand || 'Lokal';
      const cur = map.get(b) || { raw: 0, thawed: 0, loss: 0, count: 0, items: [] };
      const raw = Number(it.weightBeforeThawing) || 0;
      const thawed = Number(it.weightAfterThawing) || raw;
      const loss = Math.max(0, raw - thawed);

      cur.raw += raw;
      cur.thawed += thawed;
      cur.loss += loss;
      cur.count += 1;
      cur.items.push(it);
      map.set(b, cur);
    });

    return Array.from(map.entries())
      .filter(([_, val]) => val.count > 0 || val.raw > 0)
      .map(([brand, val]) => {
        const lossPct = val.raw > 0 ? (val.loss / val.raw) * 100 : 0;
        const yieldPct = Math.max(0, 100 - lossPct);

        let grade: 'Grade A (Optimal Yield)' | 'Grade B (Standar)' | 'Grade C (Susut Tinggi)' = 'Grade A (Optimal Yield)';
        let gradeBadge = 'bg-emerald-100 text-emerald-800 border-emerald-300';
        let recommendation = 'Kualitas prima, retensi air minimal.';

        if (lossPct > 3.5) {
          grade = 'Grade C (Susut Tinggi)';
          gradeBadge = 'bg-rose-100 text-rose-800 border-rose-300';
          recommendation = 'Waspada susut tinggi, evaluasi suhu chiller atau supplier.';
        } else if (lossPct > 2.0) {
          grade = 'Grade B (Standar)';
          gradeBadge = 'bg-amber-100 text-amber-800 border-amber-300';
          recommendation = 'Kualitas normal standar industri.';
        }

        return {
          brand,
          count: val.count,
          rawKg: val.raw,
          thawedKg: val.thawed,
          lossKg: val.loss,
          lossPercent: lossPct,
          yieldPercent: yieldPct,
          grade,
          gradeBadge,
          recommendation,
          items: val.items,
        };
      })
      .sort((a, b) => a.lossPercent - b.lossPercent);
  }, [dateItems]);

  // 3. ANALYSIS BY BATCH (Batch 1: Untuk Penjualan Malam, etc.)
  const batchAnalysis = useMemo(() => {
    const map = new Map<string, { batchId: string; purpose: string; items: ThawingItem[]; startTime?: string; endTime?: string }>();

    dateItems.forEach((it) => {
      const bId = it.batchId || `Batch ${it.batchNumber || 1}`;
      const purpose = it.batchPurpose || it.openingPurpose || 'Untuk Display Siang';
      const cur = map.get(bId) || { batchId: bId, purpose, items: [] };
      cur.items.push(it);
      if (!cur.startTime && it.thawingStartTime) cur.startTime = it.thawingStartTime;
      if (it.thawingEndTime) cur.endTime = it.thawingEndTime;
      map.set(bId, cur);
    });

    return Array.from(map.values()).map((b) => {
      const raw = b.items.reduce((acc, i) => acc + (Number(i.weightBeforeThawing) || 0), 0);
      const thawed = b.items.reduce((acc, i) => acc + (Number(i.weightAfterThawing) || Number(i.weightBeforeThawing) || 0), 0);
      const loss = Math.max(0, raw - thawed);
      const lossPct = raw > 0 ? (loss / raw) * 100 : 0;
      const allDone = b.items.length > 0 && b.items.every((i) => i.status === 'pabrikasi_done');
      const anyThawed = b.items.some((i) => i.weightAfterThawing !== null && i.weightAfterThawing !== undefined);

      let status = 'THAWING_ACTIVE';
      let statusBadge = 'bg-blue-100 text-blue-800 border-blue-200';
      let statusLabel = 'Thawing Aktif';

      if (allDone) {
        status = 'COMPLETED_CUT';
        statusBadge = 'bg-emerald-100 text-emerald-800 border-emerald-200';
        statusLabel = 'Selesai Dipabrikasi';
      } else if (anyThawed) {
        status = 'PABRIKASI_READY';
        statusBadge = 'bg-amber-100 text-amber-800 border-amber-200';
        statusLabel = 'Siap Masuk Segmentasi';
      }

      return {
        batchId: b.batchId,
        purpose: b.purpose,
        itemCount: b.items.length,
        rawKg: raw,
        thawedKg: thawed,
        lossKg: loss,
        lossPercent: lossPct,
        status,
        statusBadge,
        statusLabel,
        startTime: b.startTime,
        endTime: b.endTime,
        items: b.items,
      };
    });
  }, [dateItems]);

  // Photos collection
  const allPhotos = useMemo(() => {
    const list: ReportPhotoAttachment[] = [];
    dateItems.forEach((it, idx) => {
      if (it.image && it.image.trim() && it.image !== 'placeholder') {
        list.push({
          id: `photo_item_${it.id || idx}`,
          url: it.image,
          caption: `${it.name} (${it.brand || 'Lokal'}) - ${it.weightBeforeThawing} Kg`,
          category: 'Timbangan',
          uploadedAt: it.thawingStartTime || it.createdAt || '',
        });
      }
    });
    dateClosingRecords.forEach((c, idx) => {
      if (c.photoUrl && c.photoUrl.trim() && c.photoUrl !== 'placeholder') {
        list.push({
          id: `photo_closing_${c.id || idx}`,
          url: c.photoUrl,
          caption: `Closing: ${c.planName} - Fisik: ${c.actualClosingStockKg} Kg`,
          category: 'Closing Stock',
          uploadedAt: c.timestamp || '',
        });
      }
    });
    return list;
  }, [dateItems, dateClosingRecords]);

  // Export handlers
  const handleExportExcel = () => {
    exportStoreDailyLaporanExcel(
      { id: '1', code: 'MAIN', name: 'Central Facility', city: 'Hub', createdAt: '' },
      selectedDate,
      items,
      segments,
      adjustments,
      closingRecords,
      cogsList
    );
  };

  const handleExportCsv = () => {
    exportStoreDailyLaporanCSV(
      { id: '1', code: 'MAIN', name: 'Central Facility', city: 'Hub', createdAt: '' },
      selectedDate,
      items,
      segments,
      closingRecords
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 rounded-3xl text-white shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                Operational Yield & Quality History
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Riwayat Operasional & Kualitas Bahan
            </h1>
            <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-2xl">
              Evaluasi yield per segmentasi potong (Prime, Secondary, Tertiary, Trimming), benchmarking kualitas bahan baku per merk, serta log thawing akurat per batch.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-700 px-3 py-2 rounded-2xl">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
              />
            </div>
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black flex items-center gap-2 shadow-md transition active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download Excel</span>
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
              title="Download CSV"
            >
              <Download className="w-4 h-4" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total Bahan Diolah</span>
            <span className="text-lg font-black text-white font-mono mt-0.5 block">{totalRawKg.toFixed(2)} Kg</span>
          </div>
          <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Hasil Thawing Bersih</span>
            <span className="text-lg font-black text-emerald-400 font-mono mt-0.5 block">{totalThawedKg.toFixed(2)} Kg</span>
          </div>
          <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Susut Thawing (Loss)</span>
            <span className="text-lg font-black text-rose-400 font-mono mt-0.5 block">{totalShrinkageKg.toFixed(2)} Kg ({overallShrinkagePct.toFixed(2)}%)</span>
          </div>
          <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Rendemen / Yield Rate</span>
            <span className="text-lg font-black text-sky-400 font-mono mt-0.5 block">{overallYieldPct.toFixed(2)}%</span>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('SEGMENTASI')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'SEGMENTASI'
              ? 'bg-emerald-800 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Berdasarkan Segmentasi Potong</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('MERK')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'MERK'
              ? 'bg-emerald-800 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Berdasarkan Merk Bahan (Evaluasi Mutu)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('BATCH')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'BATCH'
              ? 'bg-emerald-800 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Berdasarkan Batch Thawing</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('DOKUMENTASI')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'DOKUMENTASI'
              ? 'bg-emerald-800 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Bukti Foto Timbangan ({allPhotos.length})</span>
        </button>
      </div>

      {/* 3. TAB 1: BERDASARKAN SEGMENTASI POTONG */}
      {activeTab === 'SEGMENTASI' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cutAnalysis.map((cut) => (
              <div
                key={cut.cutCategory}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-black text-slate-900">{cut.cutCategory}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {cut.segmentCount} Segmen
                  </span>
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">
                  {cut.totalWeightKg.toFixed(2)} <span className="text-xs text-slate-500 font-sans">Kg</span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-[11px] text-slate-600">
                  <div className="flex justify-between">
                    <span>Porsi Pabrikasi:</span>
                    <strong className="text-emerald-700 font-mono">{cut.sharePercent.toFixed(1)}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Penjualan (Sales):</span>
                    <strong className="text-slate-800 font-mono">{cut.salesKg.toFixed(2)} Kg</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Sisa Stok Fisik:</span>
                    <strong className="text-slate-900 font-mono">{cut.remainingStockKg.toFixed(2)} Kg</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Cut Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">Rincian Realisasi Potongan Segmen ({selectedDate})</h3>
              <span className="text-xs text-slate-500 font-medium">Standar: Prime Cuts, Secondary Cuts, Tertiary Cuts, Trimming</span>
            </div>

            {dateSegments.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Scale className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-slate-600">Belum ada data segmen potong untuk tanggal ini.</p>
                <p className="text-xs mt-1">Lakukan segmentasi potong di menu Segmentasi Pabrikasi.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-black tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">No</th>
                      <th className="py-3 px-4">Kategori Potongan</th>
                      <th className="py-3 px-4">Nama Potongan</th>
                      <th className="py-3 px-4">Merk Bahan</th>
                      <th className="py-3 px-4 text-right">Target (Kg)</th>
                      <th className="py-3 px-4 text-right">Realisasi (Kg)</th>
                      <th className="py-3 px-4 text-right">Susut (Kg)</th>
                      <th className="py-3 px-4 text-right">Sales (Kg)</th>
                      <th className="py-3 px-4 text-center">Waktu Input</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {dateSegments.map((seg, idx) => (
                      <tr key={seg.id || idx} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700">
                            {seg.cutCategory || 'Secondary Cuts'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">{seg.segmentName}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                            {seg.brand || 'Lokal'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600">{(seg.targetWeight || 0).toFixed(2)}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">{(seg.actualWeight || 0).toFixed(2)}</td>
                        <td className="py-3 px-4 text-right font-mono text-rose-600">{(seg.periodicShrinkage || 0).toFixed(2)}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-800">{(seg.salesKg || 0).toFixed(2)}</td>
                        <td className="py-3 px-4 text-center text-slate-400 font-mono text-[11px]">
                          {seg.createdAt ? new Date(seg.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. TAB 2: BERDASARKAN MERK BAHAN (EVALUASI KUALITAS BAHAN BAKU) */}
      {activeTab === 'MERK' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {brandAnalysis.map((b) => (
              <div
                key={b.brand}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🏷️</span>
                    <div>
                      <h3 className="font-black text-slate-900 text-base">{b.brand}</h3>
                      <span className="text-[10px] text-slate-500 font-medium">{b.count} batch / bahan diuji</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${b.gradeBadge}`}>
                    {b.grade}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Bahan Baku Awal</span>
                    <strong className="font-mono text-slate-800 text-sm">{b.rawKg.toFixed(2)} Kg</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Hasil Thawing</span>
                    <strong className="font-mono text-emerald-700 text-sm">{b.thawedKg.toFixed(2)} Kg</strong>
                  </div>
                  <div className="mt-1 pt-1 border-t border-slate-200">
                    <span className="text-[10px] text-slate-400 block uppercase">Susut Cair (Loss)</span>
                    <strong className="font-mono text-rose-600 text-sm">{b.lossKg.toFixed(2)} Kg ({b.lossPercent.toFixed(2)}%)</strong>
                  </div>
                  <div className="mt-1 pt-1 border-t border-slate-200">
                    <span className="text-[10px] text-slate-400 block uppercase">Rendemen Bersih</span>
                    <strong className="font-mono text-sky-700 text-sm">{b.yieldPercent.toFixed(2)}%</strong>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 italic bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60">
                  💡 {b.recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. TAB 3: BERDASARKAN BATCH THAWING */}
      {activeTab === 'BATCH' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {batchAnalysis.map((b) => (
              <div
                key={b.batchId}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="font-black text-slate-900 text-base">{b.batchId}</h3>
                    <p className="text-xs text-emerald-800 font-bold">{b.purpose}</p>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${b.statusBadge}`}>
                    {b.statusLabel}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Jumlah Bahan</span>
                    <strong className="font-mono text-slate-800 text-sm">{b.itemCount} Item</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Total Berat Awal</span>
                    <strong className="font-mono text-slate-800 text-sm">{b.rawKg.toFixed(2)} Kg</strong>
                  </div>
                  <div className="mt-1 pt-1 border-t border-slate-200">
                    <span className="text-[10px] text-slate-400 block uppercase">Hasil Thaw</span>
                    <strong className="font-mono text-emerald-700 text-sm">{b.thawedKg.toFixed(2)} Kg</strong>
                  </div>
                  <div className="mt-1 pt-1 border-t border-slate-200">
                    <span className="text-[10px] text-slate-400 block uppercase">Susut (%)</span>
                    <strong className="font-mono text-rose-600 text-sm">{b.lossPercent.toFixed(2)}%</strong>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                  <span>Mulai: <strong className="text-slate-800">{b.startTime ? new Date(b.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</strong></span>
                  <span>Selesai: <strong className="text-slate-800">{b.endTime ? new Date(b.endTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : (b.status === 'COMPLETED_CUT' ? 'Selesai' : 'Aktif')}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. TAB 4: BUKTI FOTO TIMBANGAN */}
      {activeTab === 'DOKUMENTASI' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-slate-900">Arsip Foto Timbangan & Dokumentasi ({selectedDate})</h3>
            <span className="text-xs text-slate-500 font-medium">{allPhotos.length} Foto Tersimpan</span>
          </div>

          {allPhotos.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Camera className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-600">Belum ada foto timbangan untuk tanggal ini.</p>
              <p className="text-xs mt-1">Unggah foto saat melakukan penimbangan bahan thawing atau closing fisik.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {allPhotos.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setPreviewPhoto(p)}
                  className="group relative bg-slate-100 rounded-2xl overflow-hidden aspect-square border border-slate-200 cursor-pointer hover:border-emerald-500 transition shadow-xs"
                >
                  <img src={p.url} alt={p.caption} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition p-2.5 flex flex-col justify-end text-white">
                    <p className="text-[10px] font-bold line-clamp-2">{p.caption}</p>
                    <span className="text-[9px] text-slate-300 font-mono mt-0.5">
                      {p.uploadedAt ? new Date(p.uploadedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Photo Lightbox Modal */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 text-white">
            <button
              type="button"
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-slate-800/80 hover:bg-slate-700 text-white rounded-full transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="aspect-video bg-black flex items-center justify-center overflow-hidden">
              <img src={previewPhoto.url} alt={previewPhoto.caption} className="max-h-[70vh] w-auto object-contain" />
            </div>
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">{previewPhoto.caption}</p>
                <span className="text-[10px] text-slate-400 font-mono">
                  {previewPhoto.uploadedAt ? new Date(previewPhoto.uploadedAt).toLocaleString('id-ID') : ''}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = previewPhoto.url;
                  link.download = `foto_timbangan_${Date.now()}.jpg`;
                  link.click();
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Simpan Foto</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
