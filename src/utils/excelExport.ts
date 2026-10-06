import XLSX from 'xlsx-js-style';
import {
  ThawingItem,
  FabricationSegment,
  StockAdjustment,
  ClosingPlanRecord,
  CogsMaster,
  Store,
} from '../types';
import { exportOperationalYieldExcel } from './operationalYieldExcel';

export { exportOperationalYieldExcel };

const BORDER_HEADER = {
  top: { style: 'thin', color: { rgb: '0F172A' } },
  bottom: { style: 'medium', color: { rgb: '0F172A' } },
  left: { style: 'thin', color: { rgb: '0F172A' } },
  right: { style: 'thin', color: { rgb: '0F172A' } },
};

const BORDER_DATA = {
  top: { style: 'thin', color: { rgb: 'E2E8F0' } },
  bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
  left: { style: 'thin', color: { rgb: 'E2E8F0' } },
  right: { style: 'thin', color: { rgb: 'E2E8F0' } },
};

const BORDER_TOTAL = {
  top: { style: 'thin', color: { rgb: '0F172A' } },
  bottom: { style: 'double', color: { rgb: '0F172A' } },
  left: { style: 'thin', color: { rgb: '0F172A' } },
  right: { style: 'thin', color: { rgb: '0F172A' } },
};

export interface StyleOptions {
  bg?: string;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  fontSize?: number;
  align?: 'left' | 'center' | 'right';
  vAlign?: 'top' | 'center' | 'bottom';
  numFmt?: string;
  border?: 'none' | 'thin' | 'darkThin' | 'totalDouble';
  wrapText?: boolean;
}

export function writeCell(
  ws: any,
  r: number,
  c: number,
  value: any,
  type?: 's' | 'n' | 'b' | 'e' | 'd',
  styleOpts?: StyleOptions
) {
  const cellRef = XLSX.utils.encode_cell({ r, c });
  let t = type;
  let v = value;

  if (v === undefined || v === null) {
    v = '';
    t = 's';
  } else if (!t) {
    if (typeof v === 'number') t = 'n';
    else if (typeof v === 'boolean') t = 'b';
    else t = 's';
  }

  const cell: any = { v, t };

  if (styleOpts) {
    const s: any = {};
    const font: any = { name: 'Calibri' };
    if (styleOpts.bold) font.bold = true;
    if (styleOpts.italic) font.italic = true;
    if (styleOpts.fontSize) font.sz = styleOpts.fontSize;
    else font.sz = 10;
    if (styleOpts.color) font.color = { rgb: styleOpts.color.replace('#', '') };
    else font.color = { rgb: '0F172A' };
    s.font = font;

    if (styleOpts.bg) {
      s.fill = {
        patternType: 'solid',
        fgColor: { rgb: styleOpts.bg.replace('#', '') },
      };
    }

    const alignment: any = {};
    if (styleOpts.align) alignment.horizontal = styleOpts.align;
    if (styleOpts.vAlign) alignment.vertical = styleOpts.vAlign;
    else alignment.vertical = 'center';
    if (styleOpts.wrapText) alignment.wrapText = true;
    s.alignment = alignment;

    if (styleOpts.border === 'darkThin') s.border = BORDER_HEADER;
    else if (styleOpts.border === 'totalDouble') s.border = BORDER_TOTAL;
    else if (styleOpts.border === 'thin') s.border = BORDER_DATA;

    if (styleOpts.numFmt) s.numFmt = styleOpts.numFmt;

    cell.s = s;
  }

  ws[cellRef] = cell;
}

/**
 * Modern Clean Excel Export for Operational Yield & Profitability Analytics
 */
export function exportStoreDailyLaporanExcel(
  _store: Store | any,
  dateStr: string,
  items: ThawingItem[],
  segments: FabricationSegment[],
  adjustments: StockAdjustment[],
  closingRecords: ClosingPlanRecord[],
  _cogsList: CogsMaster[]
) {
  exportOperationalYieldExcel({
    dateStr: dateStr || new Date().toISOString().split('T')[0],
    items: items || [],
    segments: segments || [],
    closingRecords: closingRecords || [],
    adjustments: adjustments || [],
  });
}

export function exportRekapSusutMultiStoreExcel(
  _stores: Store[],
  closingRecords: ClosingPlanRecord[],
  items: ThawingItem[],
  segments: FabricationSegment[],
  date: string
) {
  exportOperationalYieldExcel({
    dateStr: date || new Date().toISOString().split('T')[0],
    items: items || [],
    segments: segments || [],
    closingRecords: closingRecords || [],
  });
}

export function exportStoreDailyLaporanCSV(
  _store: Store | any,
  date: string,
  items: ThawingItem[],
  segments: FabricationSegment[],
  _closing: ClosingPlanRecord[]
) {
  const rows: (string | number)[][] = [
    ['MEAT TRACKER - OPERATIONAL YIELD & PROFITABILITY LOG'],
    [`Operational Date: ${date}`],
    [],
    ['NO', 'BATCH ID', 'PERUNTUKAN BATCH', 'ITEM', 'MERK', 'KATEGORI POTONG', 'BERAT AWAL (KG)', 'BERAT THAW (KG)', 'SUSUT THAWING (KG)', '% SUSUT', 'JAM MULAI', 'JAM SELESAI', 'STATUS'],
  ];

  (items || []).forEach((it, idx) => {
    const raw = Number(it.weightBeforeThawing) || 0;
    const thawed = Number(it.weightAfterThawing) || raw;
    const loss = Math.max(0, raw - thawed);
    const lossPct = raw > 0 ? (loss / raw) * 100 : 0;

    rows.push([
      idx + 1,
      it.batchId || `BATCH-01`,
      it.batchPurpose || 'Display Siang',
      it.name,
      it.brand || 'Lokal',
      it.cutCategory || 'Secondary Cuts',
      raw.toFixed(3),
      thawed.toFixed(3),
      loss.toFixed(3),
      `${lossPct.toFixed(2)}%`,
      it.thawingStartTime ? new Date(it.thawingStartTime).toLocaleTimeString('id-ID') : '-',
      it.thawingEndTime ? new Date(it.thawingEndTime).toLocaleTimeString('id-ID') : 'In Progress',
      it.batchStatus || (it.status === 'pabrikasi_done' ? 'COMPLETED_CUT' : 'ACTIVE'),
    ]);
  });

  rows.push([]);
  rows.push(['SEGMENTASI POTONG REALISASI']);
  rows.push(['NO', 'KATEGORI POTONG', 'NAMA POTONGAN', 'MERK', 'BERAT REALISASI (KG)', 'SALES (KG)', 'SISA STOK (KG)', 'WAKTU']);

  (segments || []).forEach((seg, idx) => {
    const actW = Number(seg.actualWeight) || 0;
    const sales = Number(seg.salesKg) || 0;
    rows.push([
      idx + 1,
      seg.cutCategory || 'Secondary Cuts',
      seg.segmentName,
      seg.brand || 'Lokal',
      actW.toFixed(3),
      sales.toFixed(3),
      Math.max(0, actW - sales).toFixed(3),
      seg.createdAt ? new Date(seg.createdAt).toLocaleTimeString('id-ID') : '-',
    ]);
  });

  downloadCSV(`OPERATIONAL_YIELD_${date}.csv`, rows);
}

export function exportRekapSusutCSV(
  _stores: Store[],
  closingRecords: ClosingPlanRecord[],
  items: ThawingItem[],
  segments: FabricationSegment[],
  date: string
) {
  exportStoreDailyLaporanCSV({ id: '1', name: 'Central Facility', code: 'MAIN', city: 'Hub', createdAt: '' }, date, items, segments, closingRecords);
}

export function downloadCSV(filename: string, rows: (string | number)[][]) {
  const processRow = (row: (string | number)[]) => {
    let finalVal = '';
    for (let j = 0; j < row.length; j++) {
      let innerValue = row[j] === null || row[j] === undefined ? '' : row[j].toString();
      let result = innerValue.replace(/"/g, '""');
      if (result.search(/("|,|\n)/g) >= 0) result = '"' + result + '"';
      if (j > 0) finalVal += ',';
      finalVal += result;
    }
    return finalVal + '\n';
  };

  let csvFile = '\uFEFF';
  for (let i = 0; i < rows.length; i++) {
    csvFile += processRow(rows[i]);
  }

  const blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Deprecated Non-Meat Export Handlers - redirect directly to standard Operational Yield Excel
export function exportSosisKentangDoriExcel(
  _store?: any,
  dateStr?: string,
  _closingRecords?: any[],
  _grnRecords?: any[],
  _adjustments?: any[]
) {
  exportOperationalYieldExcel({
    dateStr: dateStr || new Date().toISOString().split('T')[0],
    items: [],
    segments: [],
    closingRecords: [],
  });
}

export function exportPartingAyamExcel(
  _store?: any,
  dateStr?: string,
  _closingRecords?: any[],
  _grnRecords?: any[],
  _adjustments?: any[]
) {
  exportOperationalYieldExcel({
    dateStr: dateStr || new Date().toISOString().split('T')[0],
    items: [],
    segments: [],
    closingRecords: [],
  });
}
