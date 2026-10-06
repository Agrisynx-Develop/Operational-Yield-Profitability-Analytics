import XLSX from 'xlsx-js-style';
import { ThawingItem, FabricationSegment, ClosingPlanRecord, StockAdjustment } from '../types';

const BORDER_HEADER = {
  top: { style: 'thin', color: { rgb: '1E293B' } },
  bottom: { style: 'medium', color: { rgb: '1E293B' } },
  left: { style: 'thin', color: { rgb: '1E293B' } },
  right: { style: 'thin', color: { rgb: '1E293B' } },
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

export function exportOperationalYieldExcel(params: {
  dateStr: string;
  items: ThawingItem[];
  segments: FabricationSegment[];
  closingRecords: ClosingPlanRecord[];
  adjustments?: StockAdjustment[];
}) {
  const wb = XLSX.utils.book_new();
  const dateStr = params.dateStr || new Date().toISOString().split('T')[0];

  const filteredItems = params.items.filter((i) => (i.thawingDate || i.createdAt || '').startsWith(dateStr));
  const filteredSegments = params.segments.filter((s) => (s.createdAt || '').startsWith(dateStr));
  const filteredClosing = params.closingRecords.filter((c) => (c.date || c.timestamp || '').startsWith(dateStr));

  // -------------------------------------------------------------
  // SHEET 1: EXECUTIVE YIELD SUMMARY & BRAND ANALYSIS
  // -------------------------------------------------------------
  const summaryWs: XLSX.WorkSheet = {};
  summaryWs['!cols'] = [
    { wch: 6 },
    { wch: 32 },
    { wch: 18 },
    { wch: 22 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 22 },
  ];

  let r = 0;

  // Title Block
  summaryWs[XLSX.utils.encode_cell({ r, c: 1 })] = {
    v: 'OPERATIONAL YIELD & PROFITABILITY ANALYTICS REPORT',
    t: 's',
    s: { font: { bold: true, sz: 14, color: { rgb: '0F172A' } } },
  };
  r++;
  summaryWs[XLSX.utils.encode_cell({ r, c: 1 })] = {
    v: `Facility Operational Date: ${dateStr} | Python Analytics Engine 3.10`,
    t: 's',
    s: { font: { sz: 10, italic: true, color: { rgb: '475569' } } },
  };
  r += 2;

  // KPI Highlights
  const totalRaw = filteredItems.reduce((acc, i) => acc + (Number(i.weightBeforeThawing) || 0), 0);
  const totalThawed = filteredItems.reduce((acc, i) => acc + (Number(i.weightAfterThawing) || Number(i.weightBeforeThawing) || 0), 0);
  const totalLoss = Math.max(0, totalRaw - totalThawed);
  const yieldPct = totalRaw > 0 ? (totalThawed / totalRaw) * 100 : 100;
  const shrinkPct = totalRaw > 0 ? (totalLoss / totalRaw) * 100 : 0;

  const kpis = [
    ['Total Raw Material Issued (Kg)', totalRaw.toFixed(3)],
    ['Total Thawed Weight Realized (Kg)', totalThawed.toFixed(3)],
    ['Thawing Shrinkage Loss (Kg)', totalLoss.toFixed(3)],
    ['Facility Yield Efficiency Rate (%)', `${yieldPct.toFixed(2)}%`],
    ['Rolling Shrinkage Rate (%)', `${shrinkPct.toFixed(2)}%`],
    ['Thawing Status Benchmark', shrinkPct <= 2.0 ? 'OPTIMAL' : shrinkPct <= 3.5 ? 'WARNING' : 'CRITICAL'],
  ];

  kpis.forEach(([title, val]) => {
    summaryWs[XLSX.utils.encode_cell({ r, c: 1 })] = {
      v: title,
      t: 's',
      s: { font: { bold: true, sz: 10, color: { rgb: '1E293B' } }, fill: { fgColor: { rgb: 'F1F5F9' } }, border: BORDER_DATA },
    };
    summaryWs[XLSX.utils.encode_cell({ r, c: 2 })] = {
      v: val,
      t: 's',
      s: { font: { bold: true, sz: 11, color: { rgb: '0F172A' } }, alignment: { horizontal: 'right' }, border: BORDER_DATA },
    };
    r++;
  });

  r += 2;

  // BRAND QUALITY & YIELD BENCHMARK TABLE
  summaryWs[XLSX.utils.encode_cell({ r, c: 1 })] = {
    v: 'BRAND QUALITY & MATERIAL YIELD BENCHMARKS',
    t: 's',
    s: { font: { bold: true, sz: 11, color: { rgb: '0F172A' } } },
  };
  r++;

  const brandHeaders = ['No', 'Brand / Manufacturer', 'Raw Input (Kg)', 'Thawed Output (Kg)', 'Loss (Kg)', 'Yield Rate (%)', 'Quality Grade Benchmark'];
  brandHeaders.forEach((h, cIdx) => {
    summaryWs[XLSX.utils.encode_cell({ r, c: cIdx })] = {
      v: h,
      t: 's',
      s: { font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 10 }, fill: { fgColor: { rgb: '0F172A' } }, border: BORDER_HEADER, alignment: { horizontal: 'center' } },
    };
  });
  r++;

  // Group by Brand
  const brandMap = new Map<string, { raw: number; thawed: number; loss: number }>();
  filteredItems.forEach((it) => {
    const b = it.brand || 'General / Unspecified';
    const cur = brandMap.get(b) || { raw: 0, thawed: 0, loss: 0 };
    const raw = Number(it.weightBeforeThawing) || 0;
    const thawed = Number(it.weightAfterThawing) || raw;
    cur.raw += raw;
    cur.thawed += thawed;
    cur.loss += Math.max(0, raw - thawed);
    brandMap.set(b, cur);
  });

  let bNum = 1;
  brandMap.forEach((val, brand) => {
    const yPct = val.raw > 0 ? (val.thawed / val.raw) * 100 : 100;
    const lPct = val.raw > 0 ? (val.loss / val.raw) * 100 : 0;
    const grade = lPct <= 2.0 ? 'Grade A (Optimal Yield)' : lPct <= 3.5 ? 'Grade B (Standard)' : 'Grade C (High Shrinkage)';

    const rowData = [
      bNum++,
      brand,
      val.raw.toFixed(3),
      val.thawed.toFixed(3),
      val.loss.toFixed(3),
      `${yPct.toFixed(2)}%`,
      grade,
    ];

    rowData.forEach((d, cIdx) => {
      summaryWs[XLSX.utils.encode_cell({ r, c: cIdx })] = {
        v: d,
        t: typeof d === 'number' ? 'n' : 's',
        s: {
          border: BORDER_DATA,
          alignment: { horizontal: cIdx === 0 ? 'center' : cIdx === 1 ? 'left' : cIdx === 6 ? 'center' : 'right' },
          font: { sz: 9.5 },
        },
      };
    });
    r++;
  });

  r += 2;

  // CUT SEGMENTATION SUMMARY TABLE
  summaryWs[XLSX.utils.encode_cell({ r, c: 1 })] = {
    v: 'STANDARD CUT SEGMENTATION BREAKDOWN (PRIME, SECONDARY, TERTIARY, TRIMMING)',
    t: 's',
    s: { font: { bold: true, sz: 11, color: { rgb: '0F172A' } } },
  };
  r++;

  const cutHeaders = ['No', 'Standard Cut Category', 'Portion Realized (Kg)', 'Portion Share (%)', 'Sales Recorded (Kg)', 'Remaining Stock (Kg)'];
  cutHeaders.forEach((h, cIdx) => {
    summaryWs[XLSX.utils.encode_cell({ r, c: cIdx })] = {
      v: h,
      t: 's',
      s: { font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 10 }, fill: { fgColor: { rgb: '1E3A8A' } }, border: BORDER_HEADER, alignment: { horizontal: 'center' } },
    };
  });
  r++;

  const standardCuts = ['Prime Cuts', 'Secondary Cuts', 'Tertiary Cuts', 'Trimming'];
  const totalCutW = filteredSegments.reduce((a, s) => a + (Number(s.actualWeight) || 0), 0);

  standardCuts.forEach((cutCat, idx) => {
    const cutSegs = filteredSegments.filter((s) => (s.cutCategory || '').toLowerCase().includes(cutCat.toLowerCase().split(' ')[0]));
    const cutWeight = cutSegs.reduce((a, s) => a + (Number(s.actualWeight) || 0), 0);
    const cutSales = cutSegs.reduce((a, s) => a + (Number(s.salesKg) || 0), 0);
    const share = totalCutW > 0 ? (cutWeight / totalCutW) * 100 : 0;
    const remaining = Math.max(0, cutWeight - cutSales);

    const cRow = [
      idx + 1,
      cutCat,
      cutWeight.toFixed(3),
      `${share.toFixed(1)}%`,
      cutSales.toFixed(3),
      remaining.toFixed(3),
    ];

    cRow.forEach((d, cIdx) => {
      summaryWs[XLSX.utils.encode_cell({ r, c: cIdx })] = {
        v: d,
        t: typeof d === 'number' ? 'n' : 's',
        s: {
          border: BORDER_DATA,
          font: { sz: 9.5, bold: cIdx === 1 },
          alignment: { horizontal: cIdx === 0 ? 'center' : cIdx === 1 ? 'left' : 'right' },
        },
      };
    });
    r++;
  });

  summaryWs['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: r + 2, c: 7 } });
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Yield & Brand Summary');

  // -------------------------------------------------------------
  // SHEET 2: THAWING BATCHES & ACCURATE TIMESTAMPS
  // -------------------------------------------------------------
  const thawWs: XLSX.WorkSheet = {};
  thawWs['!cols'] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 22 },
    { wch: 30 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
  ];

  let tR = 0;
  thawWs[XLSX.utils.encode_cell({ r: tR, c: 1 })] = {
    v: 'THAWING BATCH PRODUCTION LOG & ACCURATE TIMESTAMPS',
    t: 's',
    s: { font: { bold: true, sz: 12, color: { rgb: '0F172A' } } },
  };
  tR += 2;

  const tHeaders = [
    'No',
    'Batch ID',
    'Batch Purpose / Allocation',
    'Item Description',
    'Brand',
    'Item Code',
    'Raw (Kg)',
    'Thawed (Kg)',
    'Loss (Kg)',
    'Loss (%)',
    'Thawing Start Time',
    'Thawing End Time',
    'Batch Status',
  ];

  tHeaders.forEach((h, cIdx) => {
    thawWs[XLSX.utils.encode_cell({ r: tR, c: cIdx })] = {
      v: h,
      t: 's',
      s: { font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 9.5 }, fill: { fgColor: { rgb: '1E293B' } }, border: BORDER_HEADER, alignment: { horizontal: 'center' } },
    };
  });
  tR++;

  filteredItems.forEach((it, idx) => {
    const raw = Number(it.weightBeforeThawing) || 0;
    const thawed = Number(it.weightAfterThawing) || raw;
    const loss = Math.max(0, raw - thawed);
    const lossPct = raw > 0 ? (loss / raw) * 100 : 0;

    const row = [
      idx + 1,
      it.batchId || `BATCH-${String(it.batchNumber || 1).padStart(2, '0')}`,
      it.batchPurpose || it.openingPurpose || 'Display Siang',
      it.name,
      it.brand || 'Lokal',
      it.itemCode || 'DGS-01',
      raw.toFixed(3),
      thawed.toFixed(3),
      loss.toFixed(3),
      `${lossPct.toFixed(2)}%`,
      it.thawingStartTime ? new Date(it.thawingStartTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-',
      it.thawingEndTime ? new Date(it.thawingEndTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'In Progress',
      it.batchStatus || (it.status === 'pabrikasi_done' ? 'COMPLETED_CUT' : 'ACTIVE'),
    ];

    row.forEach((v, cIdx) => {
      thawWs[XLSX.utils.encode_cell({ r: tR, c: cIdx })] = {
        v,
        t: typeof v === 'number' ? 'n' : 's',
        s: {
          border: BORDER_DATA,
          font: { sz: 9 },
          alignment: { horizontal: cIdx === 0 || cIdx === 1 || cIdx === 5 || cIdx === 10 || cIdx === 11 || cIdx === 12 ? 'center' : cIdx === 2 || cIdx === 3 ? 'left' : 'right' },
        },
      };
    });
    tR++;
  });

  thawWs['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: tR + 2, c: 12 } });
  XLSX.utils.book_append_sheet(wb, thawWs, 'Thawing Batch Logs');

  // -------------------------------------------------------------
  // SHEET 3: CUTTING SEGMENTATION & SALES CLOSING
  // -------------------------------------------------------------
  const segWs: XLSX.WorkSheet = {};
  segWs['!cols'] = [
    { wch: 6 },
    { wch: 20 },
    { wch: 28 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
  ];

  let sR = 0;
  segWs[XLSX.utils.encode_cell({ r: sR, c: 1 })] = {
    v: 'FABRICATION SEGMENTS & CLOSING STOCK RECONCILIATION',
    t: 's',
    s: { font: { bold: true, sz: 12, color: { rgb: '0F172A' } } },
  };
  sR += 2;

  const sHeaders = [
    'No',
    'Cut Category',
    'Segment Name',
    'Brand',
    'Batch Reference',
    'Realized Weight (Kg)',
    'Sales (Kg)',
    'Closing Stock (Kg)',
    'Periodic Loss (Kg)',
    'Recorded Time',
  ];

  sHeaders.forEach((h, cIdx) => {
    segWs[XLSX.utils.encode_cell({ r: sR, c: cIdx })] = {
      v: h,
      t: 's',
      s: { font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 9.5 }, fill: { fgColor: { rgb: '047857' } }, border: BORDER_HEADER, alignment: { horizontal: 'center' } },
    };
  });
  sR++;

  filteredSegments.forEach((seg, idx) => {
    const actW = Number(seg.actualWeight) || 0;
    const sales = Number(seg.salesKg) || 0;
    const remaining = Math.max(0, actW - sales);
    const loss = Number(seg.periodicShrinkage) || 0;

    const row = [
      idx + 1,
      seg.cutCategory || 'Secondary Cuts',
      seg.segmentName,
      seg.brand || 'Lokal',
      seg.batchId || 'Batch 1',
      actW.toFixed(3),
      sales.toFixed(3),
      remaining.toFixed(3),
      loss.toFixed(3),
      seg.createdAt ? new Date(seg.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-',
    ];

    row.forEach((v, cIdx) => {
      segWs[XLSX.utils.encode_cell({ r: sR, c: cIdx })] = {
        v,
        t: typeof v === 'number' ? 'n' : 's',
        s: {
          border: BORDER_DATA,
          font: { sz: 9 },
          alignment: { horizontal: cIdx === 0 || cIdx === 1 || cIdx === 4 || cIdx === 9 ? 'center' : cIdx === 2 ? 'left' : 'right' },
        },
      };
    });
    sR++;
  });

  segWs['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: sR + 2, c: 9 } });
  XLSX.utils.book_append_sheet(wb, segWs, 'Cut Segments & Closing');

  // Write and trigger download
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });

  function s2ab(s: string) {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xff;
    return buf;
  }

  const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `OPERATIONAL_YIELD_ANALYTICS_${dateStr}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
