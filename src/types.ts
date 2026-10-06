export type UserRole = 'butcher' | 'admin' | 'md';

export interface Store {
  id: string;
  code: string;
  name: string;
  city: string;
  createdAt: string;
}

export interface DataSusutRecord {
  id: string;
  date: string; // YYYY-MM-DD
  storeName: string;
  storeId: string;
  planName: string;
  susutProses: number; // Susut proses (Tally - Netto) Kg
  susutJual: number; // Susut jual (Sistem - Fisik) Kg
  createdAt?: string;
}

export interface UserAccount {
  id: string;
  username: string;
  role: UserRole;
  storeId?: string; // required for butcher & admin
  storeName?: string;
  fullName: string;
  pin?: string;
  linkedAccountId?: string; // Butcher linked with Store Admin
  createdAt: string;
}

export interface CogsMaster {
  id: string;
  itemCode: string;
  itemName: string;
  category: 'DAGING FRESH' | 'DAGING PREMIUM' | 'RAWON' | 'SHANKLE' | string;
  cogsPerKg: number; // Harga Pokok / Modal (Rp / Kg)
  defaultPricePerKg?: number; // Harga Jual Acuan (Rp / Kg)
  updatedAt: string;
  updatedBy: string;
}

export type CutSegmentCategory = 'Prime Cuts' | 'Secondary Cuts' | 'Tertiary Cuts' | 'Trimming';

export interface ThawingBatch {
  id: string; // e.g. BATCH-20261006-01
  batchNumber: number; // 1, 2, 3...
  batchPurpose: string; // Misal: 'Untuk Penjualan Malam', 'Untuk Display Siang', 'Pesanan Khusus Resto'
  date: string; // YYYY-MM-DD
  startTime: string; // ISO String (accurate timestamp)
  completedTime?: string; // ISO String
  status: 'THAWING_ACTIVE' | 'PABRIKASI_READY' | 'COMPLETED_CUT'; // Selesai jika semua bahan sudah masuk segmentasi potong
  totalRawKg: number;
  totalThawedKg: number;
  shrinkageKg: number;
  shrinkagePercent: number;
  itemCount: number;
  notes?: string;
}

export type ReportCategory = 'DAGING';

export interface GrnRecord {
  id: string;
  storeId?: string;
  date: string; // YYYY-MM-DD
  reportCategory?: string;
  itemCode?: string;
  plu?: string;
  productName: string;
  brand?: string;
  weightKg: number;
  supplier?: string;
  noSuratJalan?: string;
  receivedBy: string;
  createdAt: string;
  tallyKg?: number;
  brutoKg?: number;
  nettoKg?: number;
  costPerKg?: number;
  sellingPricePerKg?: number;
}

export interface StockAdjustment {
  id: string;
  storeId?: string;
  date: string; // YYYY-MM-DD
  meatName: string;
  planName: string;
  cutCategory?: CutSegmentCategory;
  category?: string;
  brand?: string;
  itemCode?: string;
  plu?: string;
  type: 'IN' | 'OUT';
  weightKg: number;
  reason: string;
  createdBy: string;
  createdAt: string;
}

export interface ClosingPlanRecord {
  id: string;
  storeId?: string;
  date: string; // YYYY-MM-DD
  planName: string;
  category: string;
  cutCategory?: CutSegmentCategory; // Prime Cuts | Secondary Cuts | Tertiary Cuts | Trimming
  brand?: string; // Merk bahan (e.g. Swift, Teys, Kilcoy, Santori, Lokal)
  reportCategory?: ReportCategory;
  itemCode?: string; // Kode bahan / PLU (e.g., DGS-01)
  plu?: string;
  batchId?: string;
  batchPurpose?: string;
  openingStockKg: number; // Sisa kemarin (Carryover / Stock Akhir Malam H-1)
  newProcessedKg: number; // Bahan baru diolah hari ini
  grnKg?: number; // GRN Goods Received Note
  salesKg: number; // Penjualan tercatat
  adjustInKg?: number;
  adjustOutKg?: number;
  closingStockBySystemKg: number;
  actualClosingStockKg: number; // Input fisik
  susutJualKg: number;
  photoUrl: string; // Bukti timbangan fisik
  photoCaption?: string;
  note?: string;
  isUnopened?: boolean;
  operatorName: string;
  butcherName?: string;
  timestamp: string;
}

export interface ThawingItem {
  id: string;
  batchId?: string; // ID Batch (e.g., BATCH-01)
  batchNumber?: number; // 1, 2, 3...
  batchPurpose?: string; // Peruntukan batch (e.g. 'Untuk Penjualan Malam', 'Untuk Display Siang')
  batchStatus?: 'OPEN' | 'COMPLETED_CUT'; // batch selesai apabila semua masuk segmentasi potong
  storeId?: string;
  storeName?: string;
  image: string; // Base64 or URL foto timbangan
  name: string; // Nama bahan daging
  brand: string; // Merk bahan (e.g. Swift, Teys, Kilcoy, Santori, Lokal)
  itemCode: string; // Kode item (e.g. DGS-01)
  pricePerKg?: number; // Harga per Kg spesifik bahan (Rp)
  cogsPerKg?: number;
  weightBeforeThawing: number; // Berat sebelum thawing (Kg)
  weightAfterThawing?: number; // Berat setelah thawing (Kg)
  cutCategory?: CutSegmentCategory; // 'Prime Cuts' | 'Secondary Cuts' | 'Tertiary Cuts' | 'Trimming'
  plannedFabrication: string; // Rencana potongan
  status: 'thawing' | 'pabrikasi_ready' | 'pabrikasi_done';
  thawingDate: string; // YYYY-MM-DD (akurat)
  thawingStartTime: string; // ISO String lengkap tanggal + jam detik
  thawingEndTime?: string; // ISO String lengkap tanggal + jam detik
  durationMinutes?: number;
  operatorName?: string;
  butcherName?: string;
  createdAt: string;
  shrinkageThawing?: number; // Berat susut thawing (Kg)
  shrinkageThawingPercent?: number; // Persentase susut thawing (%)
  pabrikasiCategory?: string; // Kategori Pabrikasi
  openingPurpose?: string; // Peruntukan
  susutJualKg?: number; // Susut Jual (Kg) per bahan
  salesKg?: number; // Total Penjualan / Sales (Kg)
  isCarryover?: boolean;
  isTransferred?: boolean;
  originalPurpose?: string;
  transferTimestamp?: string;
}

export interface FabricationSegment {
  id: string;
  storeId?: string;
  storeName?: string;
  itemId: string; // Relasi ke ThawingItem
  batchId?: string; // Relasi ke batch
  batchPurpose?: string;
  itemName: string;
  brand: string; // Merk bahan
  itemCode: string; // Kode item
  segmentName: string; // Nama potongan
  cutCategory: CutSegmentCategory; // Prime Cuts | Secondary Cuts | Tertiary Cuts | Trimming
  targetWeight: number; // Rencana berat (Kg)
  actualWeight: number; // Berat realisasi / Sisa Stok Aktif (Kg)
  periodicShrinkage: number; // Total susut berkala yang diupdate (Kg)
  salesKg?: number; // Total Sales / Penjualan yang sudah dicatat (Kg)
  plannedFabrication?: string;
  openingPurpose?: string;
  isTransferred?: boolean;
  originalPurpose?: string;
  transferTimestamp?: string;
  createdAt: string; // Tanggal & jam akurat
  isCarryover?: boolean;
}

export interface HppPricingRecord {
  id: string;
  storeId?: string;
  storeName?: string;
  itemCode: string;
  itemName: string;
  brand: string;
  category: string;
  purchasePricePerKg: number; // Harga beli bahan baku (Rp / Kg)
  rollingShrinkagePercent: number; // Rata-rata susut bergerak yang diintegrasikan (%)
  yieldPercent: number; // Rendemen bersih (100 - susut %)
  operationalCostPerKg: number; // Biaya operasional/potong per Kg (Rp)
  realHppPerKg: number; // HPP riil per Kg setelah faktor susut bergerak
  hiddenLossPerKg: number; // Kerugian terselubung / pembengkakan biaya per Kg (Rp)
  targetMarginPercent: number; // Target Gross Profit Margin (%)
  minSellingPricePerKg: number; // Rekomendasi harga jual minimum real-time (Rp / Kg)
  previousSellingPrice?: number; // Harga jual lama untuk perbandingan (Rp / Kg)
  realizedMarginPercent?: number; // Margin yang tersisa jika memakai harga lama (%)
  thawingEfficiencyStatus: 'OPTIMAL' | 'WASPADA' | 'KRITIS'; // Status efisiensi thawing gudang
  notes?: string;
  recordedBy: string;
  createdAt: string;
}

export interface ReportPhotoAttachment {
  id: string;
  url: string; // Base64 or image URL
  caption: string; // Keterangan foto
  category?: 'Timbangan' | 'Kebersihan Area' | 'Hasil Packaging' | 'Berita Acara' | 'Closing Stock' | 'Lainnya';
  uploadedAt: string;
}

export interface DailyClosingReport {
  id: string;
  storeId?: string;
  storeName?: string;
  date: string; // YYYY-MM-DD
  totalThawingQty: number; // Jumlah bahan yang dithawing
  totalProcessedQty: number; // Jumlah yang sudah dipabrikasi
  totalWeightBeforeThawing: number; // Total berat awal (Hanya bahan baru hari ini)
  totalWeightAfterThawing: number; // Total berat setelah thawing
  totalWeightAfterFabrication: number; // Total berat hasil segmen
  totalThawingLoss: number; // Total susut thawing
  totalFabricationLoss: number; // Total susut pabrikasi
  totalProcessLoss?: number; // Total susut proses (Thaw + Fab)
  totalSusutJual?: number; // Total susut jual (Update Susut)
  totalSalesKg?: number; // Total sales penjualan harian (Kg)
  carryoverOpeningStockKg?: number; // Sisa stok carryover dari hari kemarin
  currentClosingStockKg?: number; // Sisa stok fisik closing hari ini
  financialLossRupiah?: number; // Valuasi kerugian rupiah
  butcherInCharge: string;
  adminInCharge?: string;
  itemsProcessed: {
    id: string;
    name: string;
    plannedFabrication?: string;
    pabrikasiCategory?: string;
    openingPurpose?: 'UNTUK PESANAN' | 'UNTUK DISPLAY' | string;
    pricePerKg?: number;
    cogsPerKg?: number;
    weightBefore: number;
    weightAfter: number;
    finalWeight: number;
    thawingLossPercent: number;
    fabLossPercent: number;
    processLossKg?: number;
    processLossPercent?: number;
    susutJualKg?: number;
    susutJualPercent?: number;
    salesKg?: number;
    openingStockKg?: number;
    closingStockKg?: number;
    isCarryover?: boolean;
    fabricatedSegments?: {
      segmentName: string;
      actualWeight: number;
      targetWeight?: number;
      periodicShrinkage?: number;
      salesKg?: number;
    }[];
  }[];
  closingPlanRecords?: ClosingPlanRecord[];
  isClosed: boolean;
  closedAt?: string;
  closingPhotoUrl?: string;
  photos?: ReportPhotoAttachment[];
}

export interface LossAlertConfig {
  maxProcessLossPercent: number;
  maxSalesLossPercent: number;
  maxDailyLossPercent: number;
  safeThawingLossPercent: number;
  safeFabricationLossPercent: number;
  salesPredictionKg?: number;
}

export interface TrainingFileRecord {
  id: string;
  storeId: string;
  storeName?: string;
  title: string;
  category?: 'SOP & Standard Potong' | 'Evaluasi Hasil Praktik' | 'Sanitasi & Hygiene' | 'Sertifikasi Butcher' | 'Pelatihan Alat & Timbangan' | 'Lainnya' | string;
  trainerName?: string;
  participantNames?: string;
  date: string; // YYYY-MM-DD
  fileName: string;
  fileSizeFormatted: string;
  fileType: string;
  fileDataUrl: string; // Base64 data url for download & preview
  scoreNotes?: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface DailyTargetManualConfig {
  id: string;
  storeId: string;
  date: string; // YYYY-MM-DD
  // Target / Jumlah Operasional Harian Toko
  targetProduksiKg?: number; // Target total olah / produksi daging harian (Kg)
  targetSalesKg?: number; // Target penjualan harian (Kg)
  targetToleransiSusutPercent?: number; // Target batas susut harian (%)
  // Training harian
  targetTrainingSesiHarian?: number; // Target jumlah sesi training per hari
  targetPesertaTrainingHarian?: number; // Target jumlah butcher yang ditraining per hari
  // Catatan instruksi harian admin
  catatanHarian?: string;
  updatedBy: string;
  updatedAt: string;
}

/**
 * Record dataset historis penjualan untuk Training Model Prediksi Sales Machine Learning
 */
export interface SalesTrainingRecord {
  id: string;
  storeId: string;
  date: string; // YYYY-MM-DD
  dayName?: string; // Senin, Selasa, Rabu, Kamis, Jumat, Sabtu, Minggu
  planName?: string; // Rencana Potong / Nama Produk
  category?: string; // Kategori Pabrikasi
  salesKg: number; // Jumlah penjualan historis (Kg)
  productionKg?: number; // Jumlah olah / potong (Kg)
  lossKg?: number; // Susut (Kg)
  lossPercent?: number; // Susut (%)
  notes?: string; // Catatan promo, cuaca, libur, event
  source?: 'upload_file' | 'manual_input' | 'system_closing';
  createdAt?: string;
  // DUKUNGAN DATA DINAMIS TIDAK BAKU:
  rawRow?: Record<string, any>; // Seluruh kolom asli dari file yang di-upload
  customColumns?: string[]; // Daftar header kolom asli dari file
}

/**
 * Konfigurasi & Parameter Model ML Prediksi Sales
 */
export interface SalesPredictionModelConfig {
  storeId: string;
  targetColumnName?: string; // Nama kolom yang dijadikan target penjualan (ML)
  customColumns?: string[]; // Daftar kolom yang sedang aktif ditampilkan
  customBaselineKg?: number; // Baseline default olah/sales (Kg)
  weekendMultiplier?: number; // Pengali akhir pekan (default: 1.35)
  paydayMultiplier?: number; // Pengali tanggal gajian (default: 1.25)
  fridayMultiplier?: number; // Pengali hari jumat (default: 1.15)
  manualOverrideKg?: number; // Override manual target sales
  manualOverrideDate?: string; // Tanggal override aktif
  algorithmMode?: 'dataset_moving_average' | 'day_of_week_regression' | 'hybrid_ml' | 'python_model';
  activePythonModelId?: string; // ID Model Python (.pkl, .joblib, dll) yang sedang aktif
  activePythonModelName?: string;
  updatedAt?: string;
}

/**
 * Metadata & File Artifact Model Machine Learning hasil training Python (.pkl, .joblib, .onnx, dll)
 */
export interface PythonModelArtifact {
  id: string;
  storeId: string;
  fileName: string;
  fileType: 'pkl' | 'joblib' | 'onnx' | 'parquet' | 'pt' | 'h5' | 'json' | 'pickle' | 'other';
  fileSize: number; // bytes
  fileSizeFormatted: string;
  algorithmName?: string; // e.g. RandomForestRegressor, XGBoost, LinearRegression, PyTorch LSTM, Scikit-Learn Pipeline
  pythonFramework?: string; // e.g. Scikit-Learn, XGBoost, PyTorch, Statsmodels, Pandas Parquet
  pickleProtocol?: number; // e.g. 2, 3, 4, 5
  detectedModules?: string[]; // Module / package yang terdeteksi dari binary dump
  features?: string[];
  metrics?: {
    r2Score?: number; // Nilai R-squared (0.00 - 1.00)
    mae?: number; // Mean Absolute Error
    rmse?: number; // Root Mean Squared Error
    accuracy?: number; // Persentase akurasi 
  };
  customBaselineKg?: number; // Baseline prediksi yang dihasilkan model (Kg)
  multiplierConfig?: {
    weekendMultiplier?: number;
    paydayMultiplier?: number;
    fridayMultiplier?: number;
  };
  isActive: boolean; // Apakah model ini yang sedang aktif digunakan untuk prediksi sales
  notes?: string;
  base64Data?: string; // Data file untuk didownload kembali
  uploadedAt: string;
  uploadedBy: string;
}

export interface LossAlertConfig {
  maxProcessLossPercent: number;
  maxSalesLossPercent: number;
  maxDailyLossPercent: number;
  safeThawingLossPercent: number;
  safeFabricationLossPercent: number;
  salesPredictionKg?: number;
}

export interface TrainingFileRecord {
  id: string;
  storeId: string;
  storeName?: string;
  title: string;
  category?: 'SOP & Standard Potong' | 'Evaluasi Hasil Praktik' | 'Sanitasi & Hygiene' | 'Sertifikasi Butcher' | 'Pelatihan Alat & Timbangan' | 'Lainnya' | string;
  trainerName?: string;
  participantNames?: string;
  date: string; // YYYY-MM-DD
  fileName: string;
  fileSizeFormatted: string;
  fileType: string;
  fileDataUrl: string; // Base64 data url for download & preview
  scoreNotes?: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface DailyTargetManualConfig {
  id: string;
  storeId: string;
  date: string; // YYYY-MM-DD
  // Target / Jumlah Operasional Harian Toko
  targetProduksiKg?: number; // Target total olah / produksi daging harian (Kg)
  targetSalesKg?: number; // Target penjualan harian (Kg)
  targetToleransiSusutPercent?: number; // Target batas susut harian (%)
  // Training harian
  targetTrainingSesiHarian?: number; // Target jumlah sesi training per hari
  targetPesertaTrainingHarian?: number; // Target jumlah butcher yang ditraining per hari
  // Catatan instruksi harian admin
  catatanHarian?: string;
  updatedBy: string;
  updatedAt: string;
}

/**
 * Record dataset historis penjualan untuk Training Model Prediksi Sales Machine Learning
 */
export interface SalesTrainingRecord {
  id: string;
  storeId: string;
  date: string; // YYYY-MM-DD
  dayName?: string; // Senin, Selasa, Rabu, Kamis, Jumat, Sabtu, Minggu
  planName?: string; // Rencana Potong / Nama Produk
  category?: string; // Kategori Pabrikasi
  salesKg: number; // Jumlah penjualan historis (Kg)
  productionKg?: number; // Jumlah olah / potong (Kg)
  lossKg?: number; // Susut (Kg)
  lossPercent?: number; // Susut (%)
  notes?: string; // Catatan promo, cuaca, libur, event
  source?: 'upload_file' | 'manual_input' | 'system_closing';
  createdAt?: string;
  // DUKUNGAN DATA DINAMIS TIDAK BAKU:
  rawRow?: Record<string, any>; // Seluruh kolom asli dari file yang di-upload
  customColumns?: string[]; // Daftar header kolom asli dari file
}

/**
 * Konfigurasi & Parameter Model ML Prediksi Sales
 */
export interface SalesPredictionModelConfig {
  storeId: string;
  targetColumnName?: string; // Nama kolom yang dijadikan target penjualan (ML)
  customColumns?: string[]; // Daftar kolom yang sedang aktif ditampilkan
  customBaselineKg?: number; // Baseline default olah/sales (Kg)
  weekendMultiplier?: number; // Pengali akhir pekan (default: 1.35)
  paydayMultiplier?: number; // Pengali tanggal gajian (default: 1.25)
  fridayMultiplier?: number; // Pengali hari jumat (default: 1.15)
  manualOverrideKg?: number; // Override manual target sales
  manualOverrideDate?: string; // Tanggal override aktif
  algorithmMode?: 'dataset_moving_average' | 'day_of_week_regression' | 'hybrid_ml' | 'python_model';
  activePythonModelId?: string; // ID Model Python (.pkl, .joblib, dll) yang sedang aktif
  activePythonModelName?: string;
  updatedAt?: string;
}

/**
 * Metadata & File Artifact Model Machine Learning hasil training Python (.pkl, .joblib, .onnx, dll)
 */
export interface PythonModelArtifact {
  id: string;
  storeId: string;
  fileName: string;
  fileType: 'pkl' | 'joblib' | 'onnx' | 'parquet' | 'pt' | 'h5' | 'json' | 'pickle' | 'other';
  fileSize: number; // bytes
  fileSizeFormatted: string;
  algorithmName?: string; // e.g. RandomForestRegressor, XGBoost, LinearRegression, PyTorch LSTM, Scikit-Learn Pipeline
  pythonFramework?: string; // e.g. Scikit-Learn, XGBoost, PyTorch, Statsmodels, Pandas Parquet
  pickleProtocol?: number; // e.g. 2, 3, 4, 5
  detectedModules?: string[]; // Module / package yang terdeteksi dari binary dump
  features?: string[];
  metrics?: {
    r2Score?: number; // Nilai R-squared (0.00 - 1.00)
    mae?: number; // Mean Absolute Error
    rmse?: number; // Root Mean Squared Error
    accuracy?: number; // Persentase akurasi 
  };
  customBaselineKg?: number; // Baseline prediksi yang dihasilkan model (Kg)
  multiplierConfig?: {
    weekendMultiplier?: number;
    paydayMultiplier?: number;
    fridayMultiplier?: number;
  };
  isActive: boolean; // Apakah model ini yang sedang aktif digunakan untuk prediksi sales
  notes?: string;
  base64Data?: string; // Data file untuk didownload kembali
  uploadedAt: string;
  uploadedBy: string;
}

