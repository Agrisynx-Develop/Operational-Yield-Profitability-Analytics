import { ReportCategory, CutSegmentCategory } from '../types';

export interface CatalogProduct {
  itemCode: string;
  plu: string;
  rawBarcode?: string;
  name: string;
  brand?: string;
  vendor?: string;
  cutCategory: CutSegmentCategory;
  category: string;
  reportCategory: ReportCategory;
  subCategory: string;
  unit?: string;
  cogsPerKg?: number;
  sellingPricePerKg?: number;
}

// Operational Yield & Profitability Catalog structured strictly by standard cuts
export const DAGING_CATALOG: CatalogProduct[] = [
  // 1. Prime Cuts (Has Dalam, Has Luar, Lamusir)
  { itemCode: 'DGS-01', plu: '01001', name: 'Daging Sapi Tenderloin (Has Dalam)', brand: 'Santori', cutCategory: 'Prime Cuts', category: 'Prime Cuts', reportCategory: 'DAGING', subCategory: 'DAGING', unit: 'Kg', cogsPerKg: 145000, sellingPricePerKg: 175000 },
  { itemCode: 'DGS-02', plu: '01002', name: 'Daging Sapi Sirloin (Has Luar)', brand: 'Swift', cutCategory: 'Prime Cuts', category: 'Prime Cuts', reportCategory: 'DAGING', subCategory: 'DAGING', unit: 'Kg', cogsPerKg: 130000, sellingPricePerKg: 155000 },
  { itemCode: 'DGS-03', plu: '01003', name: 'Daging Sapi Ribeye (Lamusir)', brand: 'Teys', cutCategory: 'Prime Cuts', category: 'Prime Cuts', reportCategory: 'DAGING', subCategory: 'DAGING', unit: 'Kg', cogsPerKg: 138000, sellingPricePerKg: 165000 },

  // 2. Secondary Cuts (Chuck, Brisket, Topside)
  { itemCode: 'DGS-04', plu: '01004', name: 'Daging Sapi Paha (Chuck / Knuckle)', brand: 'Swift', cutCategory: 'Secondary Cuts', category: 'Secondary Cuts', reportCategory: 'DAGING', subCategory: 'DAGING', unit: 'Kg', cogsPerKg: 105000, sellingPricePerKg: 125000 },
  { itemCode: 'DGS-05', plu: '01005', name: 'Daging Sapi Sandung Lamur (Brisket)', brand: 'Kilcoy', cutCategory: 'Secondary Cuts', category: 'Secondary Cuts', reportCategory: 'DAGING', subCategory: 'DAGING', unit: 'Kg', cogsPerKg: 95000, sellingPricePerKg: 115000 },
  { itemCode: 'DGS-06', plu: '01006', name: 'Daging Sapi Topside / Gandik', brand: 'Teys', cutCategory: 'Secondary Cuts', category: 'Secondary Cuts', reportCategory: 'DAGING', subCategory: 'DAGING', unit: 'Kg', cogsPerKg: 110000, sellingPricePerKg: 130000 },

  // 3. Tertiary Cuts (Shankle, Short Ribs, Buntut & Rawon)
  { itemCode: 'DGS-07', plu: '01007', name: 'Daging Sapi Sengkel (Shankle)', brand: 'Kilcoy', cutCategory: 'Tertiary Cuts', category: 'Tertiary Cuts', reportCategory: 'DAGING', subCategory: 'DAGING', unit: 'Kg', cogsPerKg: 90000, sellingPricePerKg: 110000 },
  { itemCode: 'DGS-08', plu: '01008', name: 'Daging Sapi Iga (Short Ribs)', brand: 'Lokal', cutCategory: 'Tertiary Cuts', category: 'Tertiary Cuts', reportCategory: 'DAGING', subCategory: 'DAGING', unit: 'Kg', cogsPerKg: 100000, sellingPricePerKg: 120000 },
  { itemCode: 'DGS-09', plu: '01009', name: 'Daging Sapi Buntut & Rawon Curah', brand: 'Lokal', cutCategory: 'Tertiary Cuts', category: 'Tertiary Cuts', reportCategory: 'DAGING', subCategory: 'DAGING', unit: 'Kg', cogsPerKg: 85000, sellingPricePerKg: 105000 },

  // 4. Trimming (Tetelan, Daging Giling)
  { itemCode: 'DGS-10', plu: '01010', name: 'Daging Sapi Tetelan & Trimming', brand: 'Lokal', cutCategory: 'Trimming', category: 'Trimming', reportCategory: 'DAGING', subCategory: 'DAGING', unit: 'Kg', cogsPerKg: 65000, sellingPricePerKg: 85000 },
  { itemCode: 'DGS-11', plu: '01011', name: 'Daging Sapi Giling Minced Beef', brand: 'Lokal', cutCategory: 'Trimming', category: 'Trimming', reportCategory: 'DAGING', subCategory: 'DAGING', unit: 'Kg', cogsPerKg: 75000, sellingPricePerKg: 95000 },
];

export const ALL_CATALOG_PRODUCTS: CatalogProduct[] = DAGING_CATALOG;

export const KNOWN_BRANDS = ['Swift', 'Teys', 'Kilcoy', 'Santori', 'Lokal'] as const;
export type KnownBrand = typeof KNOWN_BRANDS[number];

export const CUT_CATEGORIES: CutSegmentCategory[] = [
  'Prime Cuts',
  'Secondary Cuts',
  'Tertiary Cuts',
  'Trimming'
];

export const getProductByCodeOrName = (identifier: string): CatalogProduct | undefined => {
  if (!identifier) return undefined;
  const clean = identifier.toLowerCase().trim();
  return ALL_CATALOG_PRODUCTS.find(
    (p) =>
      p.itemCode.toLowerCase() === clean ||
      p.plu.toLowerCase() === clean ||
      p.name.toLowerCase() === clean ||
      p.name.toLowerCase().includes(clean) ||
      clean.includes(p.name.toLowerCase())
  );
};

export const getProductsForCategory = (
  _category?: ReportCategory,
  _subCategory?: string
): CatalogProduct[] => {
  return DAGING_CATALOG;
};

// Aliases for any legacy references (Clean empty lists as non-meat reports are removed)
export const SOSIS_KENTANG_CATALOG: CatalogProduct[] = [];
export const FILLET_DORI_CATALOG: CatalogProduct[] = [];
export const SOSIS_KENTANG_DORI_CATALOG: CatalogProduct[] = [];
export const PARTING_AYAM_CATALOG: CatalogProduct[] = [];
