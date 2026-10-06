import { ReportCategory, CutSegmentCategory } from '../types';

export interface CatalogProduct {
  itemCode: string;
  plu: string;
  name: string;
  brand?: string;
  cutCategory: CutSegmentCategory;
  category: string;
  reportCategory: ReportCategory;
  subCategory: string;
  unit?: string;
  cogsPerKg?: number;
  sellingPricePerKg?: number;
}

// Operational Yield & Profitability Catalog structured by standard cuts
export const DAGING_CATALOG: CatalogProduct[] = [
  // Prime Cuts
  { itemCode: 'DGS-01', plu: '01001', name: 'Daging Sapi Tenderloin (Has Dalam)', brand: 'Santori', cutCategory: 'Prime Cuts', category: 'Prime Cuts', reportCategory: 'DAGING', subCategory: 'DAGING', unit: 'Kg', sellingPricePerKg: 175000 },
  { itemCode: 'DGS-02', plu: '01002', name: 'Daging Sapi Sirloin (Has Luar)', brand: 'Swift', cutCategory: 'Prime Cuts', category: 'Prime Cuts', reportCategory: 'DAGING', subCategory: 'DAGING', unit: 'Kg', sellingPricePerKg: 155000 },
  { itemCode: 'DGS-03', plu: '01003', name: 'Daging Sapi Ribeye (Lamusir)', brand: 'Teys', cutCategory: 'Prime Cuts', category: 'Prime Cuts', reportCategory: 'DAGING', subCategory: 'DAGING', unit: 'Kg', sellingPricePerKg: 165000 },

  // Secondary Cuts
  { itemCode: 'DGS-04', plu: '01004', name: 'Daging Sapi Paha (Chuck / Knuckle)', brand: 'Swift', cutCategory: 'Secondary Cuts', category: 'Secondary Cuts', reportCategory: 'DAGING', subCategory: 'DAGING', unit: 'Kg', sellingPricePerKg: 125000 },
  { itemCode: 'DGS-05', plu: '01005', name: 'Daging Sapi Sandung Lamur (Brisket)', brand: 'Kilcoy', cutCategory: 'Secondary Cuts', category: 'Secondary Cuts', reportCategory: 'DAGING', subCategory: 'DAGING', unit: 'Kg', sellingPricePerKg: 115000 },
  { itemCode: 'DGS-06', plu: '01006', name: 'Daging Sapi Topside / Gandik', brand: 'Teys', cutCategory: 'Secondary Cuts', category: 'Secondary Cuts', reportCategory: 'DAGING', subCategory: 'DAGING', unit: 'Kg', sellingPricePerKg: 130000 },

  // Tertiary Cuts
  { itemCode: 'DGS-07', plu: '01007', name: 'Daging Sapi Sengkel (Shankle)', brand: 'Kilcoy', cutCategory: 'Tertiary Cuts', category: 'Tertiary Cuts', reportCategory: 'DAGING', subCategory: 'DAGING', unit: 'Kg', sellingPricePerKg: 110000 },
  { itemCode: 'DGS-08', plu: '01008', name: 'Daging Sapi Iga (Short Ribs)', brand: 'Lokal', cutCategory: 'Tertiary Cuts', category: 'Tertiary Cuts', reportCategory: 'DAGING', subCategory: 'DAGING', unit: 'Kg', sellingPricePerKg: 120000 },
  { itemCode: 'DGS-09', plu: '01009', name: 'Daging Sapi Buntut & Rawon Curah', brand: 'Lokal', cutCategory: 'Tertiary Cuts', category: 'Tertiary Cuts', reportCategory: 'DAGING', subCategory: 'DAGING', unit: 'Kg', sellingPricePerKg: 105000 },

  // Trimming
  { itemCode: 'DGS-10', plu: '01010', name: 'Daging Sapi Tetelan & Trimming', brand: 'Lokal', cutCategory: 'Trimming', category: 'Trimming', reportCategory: 'DAGING', subCategory: 'DAGING', unit: 'Kg', sellingPricePerKg: 85000 },
  { itemCode: 'DGS-11', plu: '01011', name: 'Daging Sapi Giling Minced Beef', brand: 'Lokal', cutCategory: 'Trimming', category: 'Trimming', reportCategory: 'DAGING', subCategory: 'DAGING', unit: 'Kg', sellingPricePerKg: 95000 },
];

export const ALL_CATALOG_PRODUCTS: CatalogProduct[] = DAGING_CATALOG;

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
  category?: ReportCategory,
  _subCategory?: string
): CatalogProduct[] => {
  return DAGING_CATALOG;
};
