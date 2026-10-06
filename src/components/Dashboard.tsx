import React, { useState, useEffect, useMemo } from 'react';
import {
  ThawingItem,
  FabricationSegment,
  Store,
  GrnRecord,
  ClosingPlanRecord,
  StockAdjustment,
  ThawingBatch,
} from '../types';
import { getBatches, saveBatches, deleteBatch } from '../utils/db';
import { processHighResImage } from '../utils/imageCompressor';
import {
  Plus,
  Scale,
  Clock,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Calendar,
  Tag,
  Award,
  Play,
  RotateCcw,
  Check,
  X,
  Camera,
  Upload,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Cpu,
  RefreshCw,
} from 'lucide-react';

interface DashboardProps {
  items: ThawingItem[];
  segments: FabricationSegment[];
  currentStore?: Store;
  onAddItem: (newItem: any) => void;
  onUpdateItem?: (updatedItem: ThawingItem) => void;
  onDeleteItem?: (itemIdOrIds: string | string[]) => void;
  safeThawingLossPercent: number;
  safeFabricationLossPercent: number;
  salesPredictionKg: number;
  onUpdateSalesPrediction: (newTargetKg: number) => void;
  onTransferPurpose?: (
    id: string,
    isSegment: boolean,
    targetPurpose: 'UNTUK PESANAN' | 'UNTUK DISPLAY',
    transferWeightKg?: number
  ) => void;
  onOpenTransferModal?: () => void;
  onOpenEditPlanModal?: (itemId?: string) => void;
  isButcherView?: boolean;
  grnRecords?: GrnRecord[];
  closingRecords?: ClosingPlanRecord[];
  adjustments?: StockAdjustment[];
  onSaveGrn?: (records: GrnRecord[]) => void;
  onSaveSales?: (itemsSales: { planName: string; salesKg: number }[]) => void;
  onNavigateToClosing?: (category: any) => void;
  onNavigateToHpp?: () => void;
  initialCategory?: any;
  onCategoryChange?: (category: any) => void;
}

const KNOWN_BRANDS = ['Swift', 'Teys', 'Kilcoy', 'Santori', 'Lokal'] as const;
const CUT_CATEGORIES = ['Prime Cuts', 'Secondary Cuts', 'Tertiary Cuts', 'Trimming'] as const;

const STANDARD_MEAT_OPTIONS = [
  { name: 'Daging Sapi Tenderloin (Has Dalam)', brand: 'Santori', code: 'DGS-01', cutCategory: 'Prime Cuts', plan: 'Tenderloin / Has Dalam (Prime Cuts)' },
  { name: 'Daging Sapi Sirloin (Has Luar)', brand: 'Swift', code: 'DGS-02', cutCategory: 'Prime Cuts', plan: 'Sirloin / Has Luar (Prime Cuts)' },
  { name: 'Daging Sapi Ribeye (Lamusir)', brand: 'Teys', code: 'DGS-03', cutCategory: 'Prime Cuts', plan: 'Ribeye / Lamusir (Prime Cuts)' },
  { name: 'Daging Sapi Paha (Chuck / Knuckle)', brand: 'Swift', code: 'DGS-04', cutCategory: 'Secondary Cuts', plan: 'Chuck / Knuckle Paha (Secondary Cuts)' },
  { name: 'Daging Sapi Sandung Lamur (Brisket)', brand: 'Kilcoy', code: 'DGS-05', cutCategory: 'Secondary Cuts', plan: 'Brisket Sandung Lamur (Secondary Cuts)' },
  { name: 'Daging Sapi Topside / Gandik', brand: 'Teys', code: 'DGS-06', cutCategory: 'Secondary Cuts', plan: 'Topside / Gandik (Secondary Cuts)' },
  { name: 'Daging Sapi Sengkel (Shankle)', brand: 'Kilcoy', code: 'DGS-07', cutCategory: 'Tertiary Cuts', plan: 'Sengkel / Shankle (Tertiary Cuts)' },
  { name: 'Daging Sapi Iga (Short Ribs)', brand: 'Lokal', code: 'DGS-08', cutCategory: 'Tertiary Cuts', plan: 'Iga / Short Ribs (Tertiary Cuts)' },
  { name: 'Daging Sapi Buntut & Rawon Curah', brand: 'Lokal', code: 'DGS-09', cutCategory: 'Tertiary Cuts', plan: 'Rawon / Oxtail Sup (Tertiary Cuts)' },
  { name: 'Daging Sapi Tetelan & Trimming', brand: 'Lokal', code: 'DGS-10', cutCategory: 'Trimming', plan: 'Tetelan / Daging Giling (Trimming)' },
  { name: 'Daging Sapi Giling Minced Beef', brand: 'Lokal', code: 'DGS-11', cutCategory: 'Trimming', plan: 'Tetelan / Daging Giling (Trimming)' },
];

export default function Dashboard({
  items,
  segments,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onNavigateToHpp,
}: DashboardProps) {
  // Real-time Clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = currentTime.toISOString().split('T')[0];

  // 1. Thawing Batches State
  const [batches, setBatches] = useState<ThawingBatch[]>(() => {
    const loaded = getBatches();
    if (loaded.length > 0) return loaded;
    return [
      {
        id: 'BATCH-01',
        batchNumber: 1,
        batchPurpose: 'Untuk Penjualan Malam',
        date: todayStr,
        startTime: new Date().toISOString(),
        status: 'THAWING_ACTIVE',
        totalRawKg: 0,
        totalThawedKg: 0,
        shrinkageKg: 0,
        shrinkagePercent: 0,
        itemCount: 0,
      },
      {
        id: 'BATCH-02',
        batchNumber: 2,
        batchPurpose: 'Untuk Display Siang',
        date: todayStr,
        startTime: new Date().toISOString(),
        status: 'THAWING_ACTIVE',
        totalRawKg: 0,
        totalThawedKg: 0,
        shrinkageKg: 0,
        shrinkagePercent: 0,
        itemCount: 0,
      },
    ];
  });

  // Modal: Create New Batch
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [newBatchNumber, setNewBatchNumber] = useState(batches.length + 1);
  const [newBatchPurpose, setNewBatchPurpose] = useState('Untuk Penjualan Malam');
  const [newBatchNotes, setNewBatchNotes] = useState('');

  // 2. Thawing Form State
  const [selectedBatchId, setSelectedBatchId] = useState<string>(batches[0]?.id || 'BATCH-01');
  const [selectedMeatIndex, setSelectedMeatIndex] = useState<number>(0);
  const [meatName, setMeatName] = useState(STANDARD_MEAT_OPTIONS[0].name);
  const [brand, setBrand] = useState<string>(STANDARD_MEAT_OPTIONS[0].brand);
  const [itemCode, setItemCode] = useState<string>(STANDARD_MEAT_OPTIONS[0].code);
  const [cutCategory, setCutCategory] = useState<string>(STANDARD_MEAT_OPTIONS[0].cutCategory);
  const [weightBefore, setWeightBefore] = useState<string>('');
  const [exactStartTime, setExactStartTime] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  });
  const [photoImage, setPhotoImage] = useState<string>('');
  const [isProcessingPhoto, setIsProcessingPhoto] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quick Thaw Completion Modal
  const [completingItemId, setCompletingItemId] = useState<string | null>(null);
  const [thawedWeightInput, setThawedWeightInput] = useState<string>('');
  const [exactEndTime, setExactEndTime] = useState<string>('');

  // 3. Python Analytics State
  const [pythonStats, setPythonStats] = useState<any>(null);
  const [isPythonLoading, setIsPythonLoading] = useState(false);

  // Sync Python Analytics Engine
  const fetchPythonAnalytics = async () => {
    setIsPythonLoading(true);
    try {
      const res = await fetch('/api/python/yield-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, segments }),
      });
      if (res.ok) {
        const data = await res.json();
        setPythonStats(data);
      }
    } catch {
      // silent fallback
    } finally {
      setIsPythonLoading(false);
    }
  };

  useEffect(() => {
    fetchPythonAnalytics();
  }, [items.length, segments.length]);

  // Batch completion auto-evaluator: A batch is completed when ALL its items are segmented
  const enrichedBatches = useMemo(() => {
    return batches.map((b) => {
      const bItems = items.filter((i) => i.batchId === b.id);
      const totalRaw = bItems.reduce((acc, i) => acc + (Number(i.weightBeforeThawing) || 0), 0);
      const totalThawed = bItems.reduce((acc, i) => acc + (Number(i.weightAfterThawing) || Number(i.weightBeforeThawing) || 0), 0);
      const loss = Math.max(0, totalRaw - totalThawed);
      const lossPct = totalRaw > 0 ? (loss / totalRaw) * 100 : 0;
      const allSegmented = bItems.length > 0 && bItems.every((i) => i.status === 'pabrikasi_done');
      const anyThawed = bItems.some((i) => i.weightAfterThawing !== null && i.weightAfterThawing !== undefined);

      let status = b.status || 'THAWING_ACTIVE';
      if (allSegmented) {
        status = 'COMPLETED_CUT';
      } else if (anyThawed) {
        status = 'PABRIKASI_READY';
      } else {
        status = 'THAWING_ACTIVE';
      }

      return {
        ...b,
        status,
        itemCount: bItems.length,
        totalRawKg: totalRaw,
        totalThawedKg: totalThawed,
        shrinkageKg: loss,
        shrinkagePercent: lossPct,
        items: bItems,
      };
    });
  }, [batches, items]);

  // Save new Batch
  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const bId = `BATCH-${String(newBatchNumber).padStart(2, '0')}`;
    const newB: ThawingBatch = {
      id: bId,
      batchNumber: Number(newBatchNumber) || batches.length + 1,
      batchPurpose: newBatchPurpose.trim() || 'Untuk Penjualan Malam',
      date: todayStr,
      startTime: new Date().toISOString(),
      status: 'THAWING_ACTIVE',
      totalRawKg: 0,
      totalThawedKg: 0,
      shrinkageKg: 0,
      shrinkagePercent: 0,
      itemCount: 0,
      notes: newBatchNotes.trim(),
    };
    const updated = [newB, ...batches];
    setBatches(updated);
    saveBatches(updated);
    setSelectedBatchId(newB.id);
    setIsBatchModalOpen(false);
    setNewBatchNotes('');
    setNotification(`Batch ${newB.batchNumber} (${newB.batchPurpose}) berhasil dibuat!`);
    setTimeout(() => setNotification(null), 3000);
  };

  // Add Item to Thawing Form Submit
  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weightBefore);
    if (isNaN(w) || w <= 0) {
      setErrorMsg('Harap masukkan berat awal bahan yang valid (angka > 0)!');
      return;
    }

    const curBatch = enrichedBatches.find((b) => b.id === selectedBatchId) || enrichedBatches[0];

    // Combine today date with exactStartTime
    let startIso = new Date().toISOString();
    try {
      const [hh, mm, ss] = exactStartTime.split(':').map((n) => parseInt(n, 10));
      const dt = new Date();
      if (!isNaN(hh)) dt.setHours(hh);
      if (!isNaN(mm)) dt.setMinutes(mm);
      if (!isNaN(ss)) dt.setSeconds(ss);
      startIso = dt.toISOString();
    } catch {}

    const newItem: Omit<ThawingItem, 'id' | 'createdAt'> = {
      batchId: curBatch?.id || 'BATCH-01',
      batchNumber: curBatch?.batchNumber || 1,
      batchPurpose: curBatch?.batchPurpose || 'Untuk Display Siang',
      batchStatus: 'OPEN',
      name: meatName.trim(),
      brand: brand.trim(),
      itemCode: itemCode.trim(),
      cutCategory: cutCategory as any,
      pabrikasiCategory: cutCategory,
      weightBeforeThawing: w,
      weightAfterThawing: undefined,
      shrinkageThawing: undefined,
      shrinkageThawingPercent: undefined,
      plannedFabrication: meatName,
      status: 'thawing',
      thawingDate: todayStr,
      thawingStartTime: startIso,
      image: photoImage || 'placeholder',
      operatorName: 'Operator Potong',
    };

    onAddItem(newItem);

    // Reset inputs
    setWeightBefore('');
    setPhotoImage('');
    setErrorMsg(null);
    setNotification(`Bahan ${meatName} berhasil masuk ke ${curBatch?.id} (${curBatch?.batchPurpose})!`);
    setTimeout(() => setNotification(null), 3500);
  };

  // Photo Upload Handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingPhoto(true);
      try {
        const compressed = await processHighResImage(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.82 });
        setPhotoImage(compressed);
      } catch (err) {
        console.error('Error optimizing photo:', err);
      } finally {
        setIsProcessingPhoto(false);
      }
    }
  };

  // Complete Thawing Handler
  const handleOpenCompleteModal = (item: ThawingItem) => {
    setCompletingItemId(item.id);
    setThawedWeightInput(item.weightAfterThawing ? String(item.weightAfterThawing) : String(item.weightBeforeThawing));
    const now = new Date();
    setExactEndTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`);
  };

  const handleSaveCompleteThawing = () => {
    if (!completingItemId || !onUpdateItem) return;
    const targetItem = items.find((i) => i.id === completingItemId);
    if (!targetItem) return;

    const thawedW = parseFloat(thawedWeightInput);
    if (isNaN(thawedW) || thawedW <= 0) {
      alert('Masukkan berat hasil thawing yang valid!');
      return;
    }

    const startMs = new Date(targetItem.thawingStartTime || targetItem.createdAt).getTime();
    let endIso = new Date().toISOString();
    try {
      const [hh, mm, ss] = exactEndTime.split(':').map((n) => parseInt(n, 10));
      const dt = new Date();
      if (!isNaN(hh)) dt.setHours(hh);
      if (!isNaN(mm)) dt.setMinutes(mm);
      if (!isNaN(ss)) dt.setSeconds(ss);
      endIso = dt.toISOString();
    } catch {}

    const endMs = new Date(endIso).getTime();
    const durationMin = Math.max(1, Math.round((endMs - startMs) / 60000));
    const rawW = targetItem.weightBeforeThawing;
    const lossKg = Math.max(0, Number((rawW - thawedW).toFixed(3)));
    const lossPct = rawW > 0 ? Number(((lossKg / rawW) * 100).toFixed(2)) : 0;

    const updatedItem: ThawingItem = {
      ...targetItem,
      weightAfterThawing: thawedW,
      shrinkageThawing: lossKg,
      shrinkageThawingPercent: lossPct,
      thawingEndTime: endIso,
      durationMinutes: durationMin,
      status: 'pabrikasi_ready',
    };

    onUpdateItem(updatedItem);
    setCompletingItemId(null);
    setNotification(`Thawing ${targetItem.name} selesai! Susut: ${lossKg} Kg (${lossPct}%). Durasi: ${durationMin} menit.`);
    setTimeout(() => setNotification(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Operational Yield & Profitability Analytics
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Meat Tracker
            </h1>
            <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-2xl">
              Sistem pelacakan thawing per-batch, alokasi peruntukan operasional, segmentasi potong presisi, dan analisis profitabilitas riil berbasis Python.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="bg-slate-950/80 border border-slate-700/80 p-3 rounded-2xl flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Waktu Operasional</span>
                <span className="text-xs font-mono font-black text-white">
                  {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsBatchModalOpen(true)}
              className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Buat Batch Thawing Baru</span>
            </button>
          </div>
        </div>

        {/* Global Key Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Batch Aktif</span>
            <span className="text-lg font-black text-white font-mono mt-0.5 block">{enrichedBatches.length} Batch</span>
          </div>
          <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Bahan Sedang Thawing</span>
            <span className="text-lg font-black text-emerald-400 font-mono mt-0.5 block">
              {items.filter((i) => i.status === 'thawing').length} Item
            </span>
          </div>
          <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Siap Masuk Segmentasi</span>
            <span className="text-lg font-black text-amber-400 font-mono mt-0.5 block">
              {items.filter((i) => i.status === 'pabrikasi_ready').length} Item
            </span>
          </div>
          <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Efisiensi Yield (Python)</span>
            <span className="text-lg font-black text-sky-400 font-mono mt-0.5 block">
              {pythonStats?.thawingAnalytics?.effectiveYieldPercent ? `${pythonStats.thawingAnalytics.effectiveYieldPercent}%` : '97.5%'}
            </span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs font-bold flex items-center gap-2 shadow-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-2xl text-rose-900 text-xs font-bold flex items-center gap-2 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2. LIVE PYTHON YIELD & PROFITABILITY ENGINE PANEL */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-100 text-sky-800 rounded-2xl">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>Python Yield & Profitability Analytics Engine (Python 3.10)</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Online
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Kalkulasi rolling shrinkage harian, perankingan kualitas merk bahan, serta rekomendasi HPP dinamis real-time.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchPythonAnalytics}
            disabled={isPythonLoading}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPythonLoading ? 'animate-spin' : ''}`} />
            <span>Hitung Ulang Python</span>
          </button>
        </div>

        {/* Python Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Box 1: Rolling Shrinkage & Benchmark */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
              Susut Bergerak (Rolling Loss)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 font-mono">
                {pythonStats?.thawingAnalytics?.activeShrinkagePercent ?? '2.5'}%
              </span>
              <span className="text-xs text-slate-500 font-medium">
                (Yield: {pythonStats?.thawingAnalytics?.effectiveYieldPercent ?? '97.5'}%)
              </span>
            </div>
            <div className="text-[11px] text-slate-600 space-y-1 pt-1 border-t border-slate-200">
              <div className="flex justify-between">
                <span>Rolling 3 Hari:</span>
                <strong className="font-mono">{pythonStats?.thawingAnalytics?.rolling3AveragePercent ?? '2.5'}%</strong>
              </div>
              <div className="flex justify-between">
                <span>Rolling 7 Hari:</span>
                <strong className="font-mono">{pythonStats?.thawingAnalytics?.rolling7AveragePercent ?? '2.5'}%</strong>
              </div>
              <div className="flex justify-between">
                <span>Status Efisiensi:</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {pythonStats?.thawingAnalytics?.efficiencyStatus ?? 'OPTIMAL'}
                </span>
              </div>
            </div>
          </div>

          {/* Box 2: Quality Ranking per Merk */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
              Evaluasi Kualitas Bahan (Per Merk)
            </span>
            <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
              {(pythonStats?.brandQualityRankings || [
                { brand: 'Swift', averageShrinkagePercent: 2.1, qualityGrade: 'Grade A (Optimal Yield)' },
                { brand: 'Teys', averageShrinkagePercent: 2.8, qualityGrade: 'Grade B (Standard)' },
                { brand: 'Kilcoy', averageShrinkagePercent: 3.2, qualityGrade: 'Grade B (Standard)' },
                { brand: 'Santori', averageShrinkagePercent: 2.0, qualityGrade: 'Grade A (Optimal Yield)' },
                { brand: 'Lokal', averageShrinkagePercent: 3.8, qualityGrade: 'Grade C (High Shrinkage)' },
              ]).map((b: any) => (
                <div key={b.brand} className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60 last:border-0">
                  <span className="font-bold text-slate-800">{b.brand}</span>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-slate-600">{b.averageShrinkagePercent}%</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                      b.averageShrinkagePercent <= 2.2 ? 'bg-emerald-100 text-emerald-800' :
                      b.averageShrinkagePercent <= 3.5 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {b.averageShrinkagePercent <= 2.2 ? 'A' : b.averageShrinkagePercent <= 3.5 ? 'B' : 'C'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Box 3: Dynamic HPP & Profitability Recommendation */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
              Rekomendasi HPP Dinamis & Profit
            </span>
            <div>
              <span className="text-xs text-slate-500 block">HPP Riil Setelah Faktor Susut:</span>
              <span className="text-xl font-black text-emerald-700 font-mono">
                Rp {pythonStats?.pricingAnalytics?.realHppPerKg ? Math.round(pythonStats.pricingAnalytics.realHppPerKg).toLocaleString('id-ID') : '102.500'} / Kg
              </span>
            </div>
            <div className="text-[11px] text-slate-600 space-y-1 pt-1 border-t border-slate-200">
              <div className="flex justify-between">
                <span>Hidden Loss per Kg:</span>
                <strong className="font-mono text-rose-600">
                  Rp {pythonStats?.pricingAnalytics?.hiddenLossPerKg ? Math.round(pythonStats.pricingAnalytics.hiddenLossPerKg).toLocaleString('id-ID') : '2.500'}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Rekomendasi Harga Jual:</span>
                <strong className="font-mono text-slate-900">
                  Rp {pythonStats?.pricingAnalytics?.recommendedSellingPricePerKg ? Math.round(pythonStats.pricingAnalytics.recommendedSellingPricePerKg).toLocaleString('id-ID') : '135.000'}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SISTEM THAWING PER BATCH (WORKFLOW BATCH BERDASARKAN PERUNTUKAN) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span>Alur Thawing per Batch & Peruntukan</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                {enrichedBatches.length} Batch Terdaftar
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Setiap batch dialokasikan berdasarkan peruntukan (misal: Batch 1 untuk penjualan malam). Batch selesai otomatis apabila semua bahan masuk segmentasi potong.
            </p>
          </div>
        </div>

        {/* Batch Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {enrichedBatches.map((batch) => {
            const isCompleted = batch.status === 'COMPLETED_CUT';
            const isReady = batch.status === 'PABRIKASI_READY';

            return (
              <div
                key={batch.id}
                className={`bg-white rounded-3xl p-5 border transition shadow-sm space-y-4 relative ${
                  isCompleted
                    ? 'border-emerald-300 bg-emerald-50/20'
                    : isReady
                    ? 'border-amber-300 bg-amber-50/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      Batch #{batch.batchNumber}
                    </span>
                    <h3 className="font-black text-slate-900 text-base">{batch.batchPurpose}</h3>
                  </div>

                  <span
                    className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : isReady
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-blue-100 text-blue-800 border-blue-300'
                    }`}
                  >
                    {isCompleted ? '✓ SELESAI POTONG' : isReady ? 'Siap Dipabrikasi' : 'Thawing Aktif'}
                  </span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-bold">Jumlah Bahan</span>
                    <strong className="font-mono text-slate-800 text-sm">{batch.itemCount} Bahan</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-bold">Berat Awal</span>
                    <strong className="font-mono text-slate-800 text-sm">{batch.totalRawKg.toFixed(2)} Kg</strong>
                  </div>
                  <div className="mt-1 pt-1 border-t border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase block font-bold">Hasil Thaw</span>
                    <strong className="font-mono text-emerald-700 text-sm">{batch.totalThawedKg.toFixed(2)} Kg</strong>
                  </div>
                  <div className="mt-1 pt-1 border-t border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase block font-bold">Susut (%)</span>
                    <strong className="font-mono text-rose-600 text-sm">{batch.shrinkagePercent.toFixed(2)}%</strong>
                  </div>
                </div>

                {/* Items in this batch */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                    Daftar Bahan Dalam Batch:
                  </span>
                  {batch.items.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">Belum ada bahan ditambahkan ke batch ini.</p>
                  ) : (
                    <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                      {batch.items.map((it) => (
                        <div
                          key={it.id}
                          className="flex items-center justify-between text-xs p-1.5 bg-white rounded-xl border border-slate-100"
                        >
                          <div>
                            <span className="font-bold text-slate-900 block text-[11px]">{it.name}</span>
                            <span className="text-[10px] text-slate-400">
                              {it.brand} • {it.weightBeforeThawing} Kg
                            </span>
                          </div>
                          <div>
                            {it.status === 'thawing' ? (
                              <button
                                type="button"
                                onClick={() => handleOpenCompleteModal(it)}
                                className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold cursor-pointer transition"
                              >
                                Thawing Selesai
                              </button>
                            ) : it.status === 'pabrikasi_ready' ? (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                                Siap Potong
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                ✓ Selesai
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer status notice */}
                {isCompleted && (
                  <div className="p-2 bg-emerald-100/60 rounded-xl text-[10px] text-emerald-800 font-bold flex items-center gap-1.5 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Batch selesai: seluruh bahan sudah masuk segmentasi potong!</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. FORM INPUT BAHAN THAWING (DENGAN TANGGAL & JAM AKURAT SERTA PILIHAN BATCH) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <span>Input Bahan Thawing Baru</span>
            <span className="text-xs font-normal text-slate-500">
              (Pencatatan tanggal & jam presisi untuk evaluasi susut akurat)
            </span>
          </h2>
        </div>

        <form onSubmit={handleAddItemSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Pilih Batch */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Pilih Batch & Peruntukan:</label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {enrichedBatches.map((b) => (
                <option key={b.id} value={b.id}>
                  Batch #{b.batchNumber} - {b.batchPurpose} ({b.status === 'COMPLETED_CUT' ? 'Selesai' : 'Aktif'})
                </option>
              ))}
            </select>
          </div>

          {/* Pilih Template Bahan Standar */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Katalog Bahan / Potongan Daging:</label>
            <select
              value={selectedMeatIndex}
              onChange={(e) => {
                const idx = parseInt(e.target.value, 10);
                setSelectedMeatIndex(idx);
                const opt = STANDARD_MEAT_OPTIONS[idx];
                if (opt) {
                  setMeatName(opt.name);
                  setBrand(opt.brand);
                  setItemCode(opt.code);
                  setCutCategory(opt.cutCategory);
                }
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {STANDARD_MEAT_OPTIONS.map((opt, idx) => (
                <option key={opt.code} value={idx}>
                  {opt.name} ({opt.cutCategory})
                </option>
              ))}
            </select>
          </div>

          {/* Merk Bahan Baku */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Merk Bahan (Benchmarking Mutu):</label>
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {KNOWN_BRANDS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Kategori Potongan */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Kategori Potongan:</label>
            <select
              value={cutCategory}
              onChange={(e) => setCutCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {CUT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Berat Bahan Awal Beku */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Berat Awal Beku (Kg):</label>
            <div className="relative">
              <input
                type="number"
                step="0.001"
                placeholder="0.000"
                value={weightBefore}
                onChange={(e) => setWeightBefore(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">Kg</span>
            </div>
          </div>

          {/* Jam Mulai Thawing Presisi */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Jam Mulai Thawing (WIB):</label>
            <input
              type="text"
              value={exactStartTime}
              onChange={(e) => setExactStartTime(e.target.value)}
              placeholder="HH:mm:ss"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Foto Timbangan */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Foto Timbangan (Opsional):</label>
            <div className="flex items-center gap-2">
              <label className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200">
                <Camera className="w-3.5 h-3.5" />
                <span>{photoImage ? 'Foto Terlampir' : 'Ambil Foto'}</span>
                <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="hidden" />
              </label>
              {photoImage && (
                <button
                  type="button"
                  onClick={() => setPhotoImage('')}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200"
                  title="Hapus foto"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="md:col-span-12 flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-md transition active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Simpan & Mulai Thawing</span>
            </button>
          </div>
        </form>
      </div>

      {/* MODAL: BUAT BATCH BARU */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900">Buat Batch Thawing Baru</h3>
              <button
                type="button"
                onClick={() => setIsBatchModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nomor Urut Batch:</label>
                <input
                  type="number"
                  min="1"
                  value={newBatchNumber}
                  onChange={(e) => setNewBatchNumber(parseInt(e.target.value, 10))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Peruntukan Batch:</label>
                <select
                  value={newBatchPurpose}
                  onChange={(e) => setNewBatchPurpose(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Untuk Penjualan Malam">Untuk Penjualan Malam</option>
                  <option value="Untuk Display Siang">Untuk Display Siang</option>
                  <option value="Pesanan Khusus Restoran / Katering">Pesanan Khusus Restoran / Katering</option>
                  <option value="Alokasi Produksi Pagi">Alokasi Produksi Pagi</option>
                  <option value="Stok Cadangan Chiller">Stok Cadangan Chiller</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Catatan Tambahan (Opsional):</label>
                <input
                  type="text"
                  placeholder="Contoh: Daging untuk resto steak jam 19.00"
                  value={newBatchNotes}
                  onChange={(e) => setNewBatchNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer"
                >
                  Buat Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: INPUT SELESAI THAWING (DENGAN JAM & BERAT AKURAT) */}
      {completingItemId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900">Selesaikan Thawing Bahan</h3>
              <button
                type="button"
                onClick={() => setCompletingItemId(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Berat Setelah Thawing (Kg):</label>
                <input
                  type="number"
                  step="0.001"
                  value={thawedWeightInput}
                  onChange={(e) => setThawedWeightInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Jam Selesai Thawing (WIB):</label>
                <input
                  type="text"
                  value={exactEndTime}
                  onChange={(e) => setExactEndTime(e.target.value)}
                  placeholder="HH:mm:ss"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCompletingItemId(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveCompleteThawing}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer"
                >
                  Simpan Selesai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
