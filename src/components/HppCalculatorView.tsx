import React, { useState, useEffect, useMemo } from 'react';
import { ThawingItem, Store, HppPricingRecord } from '../types';
import {
  calculateRollingShrinkage,
  calculateAutomatedHpp,
  getStoredHppRecords,
  saveHppPricingRecord,
  deleteHppPricingRecord,
  RollingShrinkageAnalysis,
} from '../utils/rollingHpp';
import { DEFAULT_NAMA_BAHAN_LIST } from '../utils/shrinkage';
import {
  Calculator,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Scale,
  Save,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  Info,
  Layers,
  ArrowRight,
  ShieldAlert,
  Percent,
  Sliders,
  Share2,
  Tag,
  Beef,
  Flame,
  Clock
} from 'lucide-react';

interface HppCalculatorViewProps {
  items: ThawingItem[];
  currentStore?: Store;
}

export default function HppCalculatorView({ items, currentStore }: HppCalculatorViewProps) {
  // 1. Selection & Input States
  const [selectedMeatIndex, setSelectedMeatIndex] = useState<number>(0);
  const [customItemName, setCustomItemName] = useState('');
  const [brandInput, setBrandInput] = useState('Swift');
  const [itemCodeInput, setItemCodeInput] = useState('DGS-01');
  const [purchasePriceInput, setPurchasePriceInput] = useState<string>('95000');
  const [operationalCostInput, setOperationalCostInput] = useState<string>('2500');
  const [targetMarginInput, setTargetMarginInput] = useState<number>(20);
  const [previousSellingPriceInput, setPreviousSellingPriceInput] = useState<string>('120000');
  const [notesInput, setNotesInput] = useState('');

  // Mode Susut Bergerak: 'REAL_AUTO' (menggunakan data riil susut thawing gudang) atau 'SIMULATION' (slider simulasi)
  const [shrinkageMode, setShrinkageMode] = useState<'REAL_AUTO' | 'SIMULATION'>('REAL_AUTO');
  const [simulationShrinkage, setSimulationShrinkage] = useState<number>(5.5);

  // Success / Copied Notification State
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // History list
  const [hppHistory, setHppHistory] = useState<HppPricingRecord[]>(() => getStoredHppRecords());
  const [historySearch, setHistorySearch] = useState('');

  // Sinkronisasi pilihan bahan default saat dropdown berubah
  const handleSelectMeat = (index: number) => {
    setSelectedMeatIndex(index);
    if (index >= 0 && index < DEFAULT_NAMA_BAHAN_LIST.length) {
      const meat = DEFAULT_NAMA_BAHAN_LIST[index];
      setCustomItemName(meat.name);
      setBrandInput(meat.defaultBrand || 'Lokal');
      setItemCodeInput(meat.code || `DGS-0${index + 1}`);

      // Set perkiraan harga beli awal yang realistis berdasarkan kategori potong
      if (meat.cutCategory === 'Prime Cuts' || meat.category === 'Prime Cuts') {
        setPurchasePriceInput('145000');
        setPreviousSellingPriceInput('175000');
      } else if (meat.cutCategory === 'Secondary Cuts' || meat.category === 'Secondary Cuts') {
        setPurchasePriceInput('105000');
        setPreviousSellingPriceInput('125000');
      } else if (meat.cutCategory === 'Tertiary Cuts' || meat.category === 'Tertiary Cuts') {
        setPurchasePriceInput('95000');
        setPreviousSellingPriceInput('115000');
      } else if (meat.cutCategory === 'Trimming' || meat.category === 'Trimming') {
        setPurchasePriceInput('70000');
        setPreviousSellingPriceInput('90000');
      } else {
        setPurchasePriceInput('100000');
        setPreviousSellingPriceInput('125000');
      }
    }
  };

  useEffect(() => {
    handleSelectMeat(0);
  }, []);

  // 2. Hitung Nilai Susut Bergerak Real-Time dari Riwayat Gudang
  const activeMeatName = customItemName || DEFAULT_NAMA_BAHAN_LIST[selectedMeatIndex]?.name || 'Daging Sapi Paha';
  const rollingAnalysis: RollingShrinkageAnalysis = useMemo(() => {
    return calculateRollingShrinkage(items, activeMeatName, brandInput);
  }, [items, activeMeatName, brandInput]);

  // Tentukan nilai susut bergerak yang aktif digunakan
  const activeShrinkagePercent =
    shrinkageMode === 'REAL_AUTO'
      ? rollingAnalysis.selectedRollingShrinkagePercent
      : simulationShrinkage;

  // 3. Kalkulasi HPP dan Rekomendasi Harga Jual Minimum
  const hppResult = useMemo(() => {
    return calculateAutomatedHpp({
      purchasePricePerKg: parseFloat(purchasePriceInput) || 0,
      rollingShrinkagePercent: activeShrinkagePercent,
      operationalCostPerKg: parseFloat(operationalCostInput) || 0,
      targetMarginPercent: targetMarginInput,
      previousSellingPrice: parseFloat(previousSellingPriceInput) || 0,
    });
  }, [
    purchasePriceInput,
    activeShrinkagePercent,
    operationalCostInput,
    targetMarginInput,
    previousSellingPriceInput,
  ]);

  // 4. Handler Simpan Rekaman HPP
  const handleSaveHppRecord = () => {
    const newRecord: HppPricingRecord = {
      id: `hpp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      storeId: currentStore?.id || '1',
      storeName: currentStore?.name || 'Operational Processing Hub',
      itemCode: itemCodeInput || 'DGS-01',
      itemName: activeMeatName,
      brand: brandInput || 'Lokal',
      category: DEFAULT_NAMA_BAHAN_LIST[selectedMeatIndex]?.category || 'DAGING FRESH',
      purchasePricePerKg: hppResult.purchasePricePerKg,
      rollingShrinkagePercent: hppResult.rollingShrinkagePercent,
      yieldPercent: hppResult.yieldPercent,
      operationalCostPerKg: hppResult.operationalCostPerKg,
      realHppPerKg: hppResult.realHppPerKg,
      hiddenLossPerKg: hppResult.hiddenLossPerKg,
      targetMarginPercent: hppResult.targetMarginPercent,
      minSellingPricePerKg: hppResult.minSellingPricePerKg,
      previousSellingPrice: hppResult.previousSellingPrice,
      realizedMarginPercent: hppResult.realizedMarginPercent,
      thawingEfficiencyStatus: rollingAnalysis.efficiencyStatus,
      notes: notesInput.trim() || undefined,
      recordedBy: 'Petugas Butcher',
      createdAt: new Date().toISOString(),
    };

    const updated = saveHppPricingRecord(newRecord);
    setHppHistory(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // 5. Handler Hapus Catatan
  const handleDeleteRecord = (id: string) => {
    const updated = deleteHppPricingRecord(id);
    setHppHistory(updated);
  };

  // 6. Copy Rekomendasi untuk Tim Pricing (WhatsApp/Chat)
  const handleCopyRecommendation = () => {
    const deltaLoss = hppResult.hiddenLossPerKg;
    const warningHeader =
      rollingAnalysis.efficiencyStatus === 'KRITIS'
        ? '🚨 [ALERT PRICING - EFISIENSI THAWING MENURUN KRITIS]'
        : rollingAnalysis.efficiencyStatus === 'WASPADA'
        ? '⚠️ [PERINGATAN PRICING - SUSUT THAWING MENINGKAT]'
        : '📋 [REKOMENDASI HARGA JUAL MINIMUM REAL-TIME]';

    const text = `${warningHeader}
Cabang: ${currentStore?.name || 'TDN'}
Waktu: ${new Date().toLocaleString('id-ID')}
------------------------------------------------
Bahan: ${activeMeatName}
Merk: ${brandInput || 'Lokal'} | Kode: ${itemCodeInput}
Status Thawing: ${rollingAnalysis.efficiencyStatus} (${rollingAnalysis.statusMessage})

ANALISA HPP & RENDEMEN:
- Harga Beli Bahan: Rp ${hppResult.purchasePricePerKg.toLocaleString('id-ID')} / Kg
- Rata-rata Susut Bergerak: ${hppResult.rollingShrinkagePercent}% (Rendemen: ${hppResult.yieldPercent}%)
- Biaya Potong/Operasional: Rp ${hppResult.operationalCostPerKg.toLocaleString('id-ID')} / Kg
- HPP Riil Terkoreksi: Rp ${hppResult.realHppPerKg.toLocaleString('id-ID')} / Kg
- Kerugian Terselubung (Drip Loss): +Rp ${deltaLoss.toLocaleString('id-ID')} / Kg

REKOMENDASI TIM PRICING:
- Target Margin Keuntungan: ${hppResult.targetMarginPercent}%
- Harga Jual Minimum Wajib: Rp ${hppResult.minSellingPricePerKg.toLocaleString('id-ID')} / Kg
${
  hppResult.previousSellingPrice
    ? `- Harga Jual Saat Ini: Rp ${hppResult.previousSellingPrice.toLocaleString('id-ID')} / Kg
- Margin Tersisa (Jika Harga Tetap): ${hppResult.realizedMarginPercent}% ${
        hppResult.isMarginAtRisk ? '(⚠️ MARGIN TERGERUS!)' : '(Aman)'
      }`
    : ''
}

Tindakan: ${hppResult.recommendationAction}
------------------------------------------------
Pencatatan Otomatis Butcher TDN Meat Tracker`;

    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 3000);
  };

  // Filter riwayat
  const filteredHistory = hppHistory.filter((r) => {
    if (!historySearch) return true;
    const q = historySearch.toLowerCase();
    return (
      r.itemName.toLowerCase().includes(q) ||
      (r.brand && r.brand.toLowerCase().includes(q)) ||
      (r.itemCode && r.itemCode.toLowerCase().includes(q)) ||
      r.createdAt.includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* 1. HEADER SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-600 text-white rounded-xl shadow-xs">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Kalkulator & Pencatatan HPP Otomatis
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-700 uppercase">
                  Rolling Shrinkage
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Mengintegrasikan rata-rata susut bergerak real-time untuk melindungi margin perusahaan dari kerugian terselubung.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyRecommendation}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                copiedSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
              title="Salin rekomendasi harga jual ke clipboard untuk dikirim ke tim pricing"
            >
              {copiedSuccess ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedSuccess ? 'Tersalin ke Clipboard!' : 'Salin Rekomendasi Pricing'}</span>
            </button>

            <button
              onClick={handleSaveHppRecord}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                savedSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{savedSuccess ? 'Tersimpan!' : 'Simpan Rekam HPP'}</span>
            </button>
          </div>
        </div>

        {/* 2. REAL-TIME WAREHOUSE EFFICIENCY BANNER */}
        <div className={`mt-5 p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${rollingAnalysis.statusColor}`}>
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              {rollingAnalysis.efficiencyStatus === 'KRITIS' ? (
                <ShieldAlert className="w-5 h-5 text-red-600 animate-bounce" />
              ) : rollingAnalysis.efficiencyStatus === 'WASPADA' ? (
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider">
                  Status Efisiensi Thawing Gudang:
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  rollingAnalysis.efficiencyStatus === 'KRITIS'
                    ? 'bg-red-600 text-white'
                    : rollingAnalysis.efficiencyStatus === 'WASPADA'
                    ? 'bg-amber-600 text-white'
                    : 'bg-emerald-600 text-white'
                }`}>
                  {rollingAnalysis.efficiencyStatus}
                </span>
              </div>
              <p className="text-xs font-semibold mt-0.5 leading-snug">
                {rollingAnalysis.statusMessage}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/70 backdrop-blur-xs px-3.5 py-2 rounded-lg border border-slate-200/60 self-start sm:self-auto">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">Rolling 3-Batch</div>
              <div className="text-sm font-black text-slate-900">{rollingAnalysis.rolling3AveragePercent}%</div>
            </div>
            <div className="h-6 w-px bg-slate-300" />
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">Rolling 7-Batch</div>
              <div className="text-sm font-black text-slate-900">{rollingAnalysis.rolling7AveragePercent}%</div>
            </div>
            <div className="h-6 w-px bg-slate-300" />
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">Sampel Data</div>
              <div className="text-sm font-black text-slate-900">{rollingAnalysis.sampleCount} Batch</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN INTERACTIVE CALCULATOR GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: PARAMETER INPUT FORM (7 COLS) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-red-600" />
              1. Parameter Bahan & Pembelian
            </h2>

            <div className="space-y-4">
              {/* Pilihan Daging / Bahan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Bahan Baku Daging / Olahan:
                </label>
                <select
                  value={selectedMeatIndex}
                  onChange={(e) => handleSelectMeat(parseInt(e.target.value, 10))}
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
                >
                  {DEFAULT_NAMA_BAHAN_LIST.map((meat, idx) => (
                    <option key={idx} value={idx}>
                      {meat.name} ({meat.category}) - Rekomendasi Potong: {meat.plan}
                    </option>
                  ))}
                </select>
              </div>

              {/* Input Merk Bahan & Kode Bahan (REQUIRED by user) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-red-600" />
                    Merk / Brand Bahan:
                  </label>
                  <input
                    type="text"
                    value={brandInput}
                    onChange={(e) => setBrandInput(e.target.value)}
                    placeholder="Contoh: Swift, Teys, Santori, Lokal"
                    className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                  <div className="flex gap-1.5 mt-1.5 overflow-x-auto pb-1 text-[10px]">
                    {['Swift', 'Teys', 'Kilcoy', 'Santori', 'Wonokoyo', 'Lokal'].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setBrandInput(b)}
                        className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold cursor-pointer whitespace-nowrap"
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-blue-600" />
                    Kode Bahan / PLU:
                  </label>
                  <input
                    type="text"
                    value={itemCodeInput}
                    onChange={(e) => setItemCodeInput(e.target.value.toUpperCase())}
                    placeholder="Contoh: DGS-01, AYM-01"
                    className="w-full text-xs font-bold font-mono bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 font-medium">
                    Kode identifikasi unik untuk tim gudang & pricing
                  </span>
                </div>
              </div>

              {/* Harga Beli Bahan & Biaya Operasional */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    Harga Beli Bahan Baku (Rp / Kg):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                    <input
                      type="number"
                      value={purchasePriceInput}
                      onChange={(e) => setPurchasePriceInput(e.target.value)}
                      placeholder="95000"
                      className="w-full text-xs font-bold bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">Harga faktur / penerimaan supplier</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-600" />
                    Biaya Operasional / Potong (Rp / Kg):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                    <input
                      type="number"
                      value={operationalCostInput}
                      onChange={(e) => setOperationalCostInput(e.target.value)}
                      placeholder="2500"
                      className="w-full text-xs font-bold bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">Tenaga potong, wrapping, plastik, dll</span>
                </div>
              </div>

              {/* Mode Nilai Susut Bergerak */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-red-600" />
                    Integrasi Nilai Susut Bergerak:
                  </label>
                  <div className="flex rounded-lg bg-slate-100 p-0.5 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setShrinkageMode('REAL_AUTO')}
                      className={`px-2.5 py-1 rounded-md transition ${
                        shrinkageMode === 'REAL_AUTO'
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      ⚡ Auto Riil Gudang ({rollingAnalysis.selectedRollingShrinkagePercent}%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setShrinkageMode('SIMULATION')}
                      className={`px-2.5 py-1 rounded-md transition ${
                        shrinkageMode === 'SIMULATION'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      🎛️ Simulasi What-If
                    </button>
                  </div>
                </div>

                {shrinkageMode === 'REAL_AUTO' ? (
                  <div className="p-3 bg-red-50/70 border border-red-200/70 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-black text-red-900">
                        Susut Bergerak Terhubung: {rollingAnalysis.selectedRollingShrinkagePercent}%
                      </div>
                      <div className="text-[11px] text-red-700">
                        Rendemen daging bersih siap jual: <span className="font-bold">{(100 - rollingAnalysis.selectedRollingShrinkagePercent).toFixed(2)}%</span>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded-md text-[10px] font-black bg-red-200 text-red-800 uppercase">
                      Live Thawing Feed
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-blue-50/70 border border-blue-200/70 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-900">
                        Simulasi Penurunan Efisiensi Thawing:
                      </span>
                      <span className="text-sm font-black text-blue-700">{simulationShrinkage}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="20.0"
                      step="0.1"
                      value={simulationShrinkage}
                      onChange={(e) => setSimulationShrinkage(parseFloat(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-blue-600 font-semibold">
                      <span>0.5% (Sangat Efisien)</span>
                      <span>5.0% (Mulai Bocor)</span>
                      <span>15.0% (Sangat Kritis)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Target Margin & Harga Jual Lama untuk Komparasi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5 text-blue-600" />
                      Target Margin Kotor:
                    </label>
                    <span className="text-xs font-black text-blue-600">{targetMarginInput}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="1"
                    value={targetMarginInput}
                    onChange={(e) => setTargetMarginInput(parseInt(e.target.value, 10))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>5%</span>
                    <span>20% (Standar)</span>
                    <span>50%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                    Harga Jual Saat Ini / Lama (Rp):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">Rp</span>
                    <input
                      type="number"
                      value={previousSellingPriceInput}
                      onChange={(e) => setPreviousSellingPriceInput(e.target.value)}
                      placeholder="120000"
                      className="w-full text-xs font-bold bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">Untuk mengecek apakah margin tergerus</span>
                </div>
              </div>

              {/* Catatan / Keterangan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan untuk Tim Pricing:
                </label>
                <input
                  type="text"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Misal: Batch baru kemasan vacuum sedikit berair, efisiensi thawing berkurang 1.2%"
                  className="w-full text-xs font-medium bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: REAL-TIME OUTPUT & PRICING RECOMMENDATION CARDS (5 COLS) */}
        <div className="lg:col-span-5 space-y-5">
          {/* CARD 1: REKOMENDASI HARGA JUAL MINIMUM (HERO CARD) */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-2xl" />

            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-red-400 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" />
                Rekomendasi Tim Pricing (Real-Time)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                Target Margin: {hppResult.targetMarginPercent}%
              </span>
            </div>

            <div className="mt-2">
              <div className="text-[11px] font-semibold text-slate-400">Harga Jual Minimum yang Direkomendasikan:</div>
              <div className="text-3xl font-black text-white mt-1 tracking-tight flex items-baseline gap-1">
                <span>Rp {hppResult.minSellingPricePerKg.toLocaleString('id-ID')}</span>
                <span className="text-xs font-semibold text-slate-400">/ Kg</span>
              </div>
            </div>

            {/* Action Alert Message */}
            <div className={`mt-4 p-3 rounded-xl border text-xs font-bold leading-relaxed ${
              hppResult.isMarginAtRisk
                ? 'bg-red-950/80 border-red-800 text-red-200'
                : 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
            }`}>
              {hppResult.recommendationAction}
            </div>

            {/* Price Delta Comparison */}
            {hppResult.previousSellingPrice ? (
              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Harga Lama vs Rekomendasi:</span>
                <span className={`font-black ${
                  hppResult.minSellingPricePerKg > hppResult.previousSellingPrice
                    ? 'text-red-400'
                    : 'text-emerald-400'
                }`}>
                  {hppResult.minSellingPricePerKg > hppResult.previousSellingPrice
                    ? `+Rp ${(hppResult.minSellingPricePerKg - hppResult.previousSellingPrice).toLocaleString('id-ID')}`
                    : 'Sudah di atas batas aman'}
                </span>
              </div>
            ) : null}
          </div>

          {/* CARD 2: REAL HPP & KERUGIAN TERSELUBUNG BREAKDOWN */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-red-600" />
              Perhitungan HPP Riil & Kerugian Terselubung
            </h3>

            <div className="space-y-3">
              {/* Rendemen Bersih */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <div className="text-xs font-bold text-slate-800">Rendemen Bersih (Yield)</div>
                  <div className="text-[10px] text-slate-500">100% dikurangi susut bergerak {hppResult.rollingShrinkagePercent}%</div>
                </div>
                <div className="text-sm font-black text-slate-900">{hppResult.yieldPercent}%</div>
              </div>

              {/* HPP Bahan Baku Terkoreksi */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <div className="text-xs font-bold text-slate-800">HPP Bahan Baku Terkoreksi</div>
                  <div className="text-[10px] text-slate-500">Harga beli dibagi rasio rendemen</div>
                </div>
                <div className="text-sm font-black text-slate-900">
                  Rp {hppResult.rawMaterialCostAdjusted.toLocaleString('id-ID')} / Kg
                </div>
              </div>

              {/* HPP Riil Total */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-200">
                <div>
                  <div className="text-xs font-black text-red-900">HPP Riil Total per Kg</div>
                  <div className="text-[10px] text-red-700">Bahan terkoreksi + biaya potong</div>
                </div>
                <div className="text-base font-black text-red-700">
                  Rp {hppResult.realHppPerKg.toLocaleString('id-ID')} / Kg
                </div>
              </div>

              {/* Kerugian Terselubung (The Core Value Prop) */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-black text-amber-900">Kerugian Terselubung (Drip Loss)</span>
                  </div>
                  <span className="text-sm font-black text-amber-800">
                    +Rp {hppResult.hiddenLossPerKg.toLocaleString('id-ID')} / Kg
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 mt-1 font-medium leading-relaxed">
                  Modal membengkak <span className="font-bold">Rp {hppResult.hiddenLossPerKg.toLocaleString('id-ID')}</span> per kilogram akibat susut air/thawing yang tidak tercatat di faktur pembelian.
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={handleCopyRecommendation}
                className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Kirim Rekomendasi</span>
              </button>

              <button
                onClick={handleSaveHppRecord}
                className="w-full py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Catatan</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. RIWAYAT PENCATATAN HPP & REKOMENDASI HARGA TABEL */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-600" />
              Riwayat Sistem Pencatatan HPP & Rekomendasi Harga ({hppHistory.length})
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Data HPP yang tercatat otomatis dengan integrasi susut bergerak harian.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Cari bahan, merk, atau kode..."
              className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-500 w-48 sm:w-64"
            />
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl">
            <Calculator className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600">Belum ada riwayat kalkulasi HPP yang tersimpan</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Gunakan tombol "Simpan Rekam HPP" di atas untuk mendokumentasikan analisis harga dan susut.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Tanggal & Waktu</th>
                  <th className="py-2.5 px-3">Bahan & Merk</th>
                  <th className="py-2.5 px-3">Kode</th>
                  <th className="py-2.5 px-3 text-right">Harga Beli</th>
                  <th className="py-2.5 px-3 text-right">Susut Bergerak</th>
                  <th className="py-2.5 px-3 text-right">HPP Riil</th>
                  <th className="py-2.5 px-3 text-right">Kerugian Terselubung</th>
                  <th className="py-2.5 px-3 text-right">Harga Jual Min</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      <div className="font-semibold">{rec.createdAt.split('T')[0]}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {rec.createdAt.split('T')[1]?.substring(0, 5) || ''}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{rec.itemName}</div>
                      <div className="text-[10px] font-semibold text-slate-500">
                        Merk: <span className="text-red-700">{rec.brand || 'Lokal'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-blue-700">
                      {rec.itemCode || '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-700">
                      Rp {rec.purchasePricePerKg.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-red-600">
                      {rec.rollingShrinkagePercent}%
                    </td>
                    <td className="py-3 px-3 text-right font-black text-slate-900">
                      Rp {rec.realHppPerKg.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-amber-600">
                      +Rp {rec.hiddenLossPerKg.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-emerald-700">
                      Rp {rec.minSellingPricePerKg.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                        rec.thawingEfficiencyStatus === 'KRITIS'
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : rec.thawingEfficiencyStatus === 'WASPADA'
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}>
                        {rec.thawingEfficiencyStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleDeleteRecord(rec.id)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded transition cursor-pointer"
                        title="Hapus Rekaman"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
