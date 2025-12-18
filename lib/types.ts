
// Baglet Status enum
export enum BagletStatus {
  NONE = 'NONE',
  PLANNED = 'PLANNED',
  PREPARED = 'PREPARED',
  STERILIZED = 'STERILIZED',
  INOCULATED = 'INOCULATED',
  INCUBATED = 'INCUBATED',
  PINNED = 'PINNED',
  HARVESTED = 'HARVESTED',
  REHARVESTED_1 = 'REHARVESTED_1',
  REHARVESTED_2 = 'REHARVESTED_2',
  REHARVESTED_3 = 'REHARVESTED_3',
  REHARVESTED_4 = 'REHARVESTED_4',
  CONTAMINATED = 'CONTAMINATED',
  CRC_ANALYZED = 'CRC_ANALYZED',
  DISPOSED = 'DISPOSED',
  RECYCLED = 'RECYCLED',
  DAMAGED = 'DAMAGED',
  DELETED = 'DELETED',
}

// Mushroom types
// Mushroom types
export type MushroomType = string;

// Core Entities
export interface Batch {
  id: string;
  mushroomType: MushroomType;
  vendorName: string;
  substrateCode: string;
  substrateDescription: string;
  plannedBagletCount: number;
  actualBagletCount: number;
  createdDate: Date;
  preparedDate: Date;
  notes?: string;
  bagletStatusCounts?: Record<string, number>;
  createdBy: string;
  batchSequence: number;
}

export interface Baglet {
  id: string;
  batchId: string;
  status: BagletStatus;
  lastStatusChange: Date;
  metrics?: Metric;
}

export interface Metric {
  temperature: number; // Celsius
  humidity: number; // Percentage
  co2Level: number; // PPM
  lightLevel: number; // Lux
  recordedAt: Date;
}

export interface HarvestEntry {
  id: string;
  batchId: string;
  bagletId: string;
  weight: number; // Grams
  harvestDate: Date;
  notes?: string;
}

export interface StatusLogEntry {
  id: string;
  bagletId: string;
  batchId: string;
  previousStatus: BagletStatus;
  newStatus: BagletStatus;
  timestamp: Date;
  notes?: string;
}

// ==========================================
// DTOs (Data Transfer Objects)
// Used in API responses and frontend views
// ==========================================

export interface BatchListItem {
  id: string;
  mushroomType: string;
  vendorName: string;
  substrateCode: string;
  substrateDescription: string;
  plannedBagletCount: number;
  actualBagletCount: number;
  createdDate: string;
  preparedDate: string;
  bagletStatusCounts: Record<string, number>;
  createdBy: string;
  batchSequence: number;
}

export interface BatchDetails {
  id: string;
  farmId: string;
  farmName: string;
  preparedDate: string;
  batchSequence: number;
  mushroomType: string;
  mushroomId: string;
  strain: {
    code: string;
    vendorId: string;
    vendorName: string;
  };
  substrate: {
    id: string;
    name: string;
    mediums: Array<{ medium_id: string; medium_name: string; qty_g: number }>;
    supplements: Array<{ supplement_id: string; supplement_name: string; qty: number; unit: string }>;
    mediumsForBatch: Array<{ medium_id: string; medium_name: string; qty_g: number }>;
    supplementsForBatch: Array<{ supplement_id: string; supplement_name: string; qty: number; unit: string }>;
  };
  plannedBagletCount: number;
  actualBagletCount: number;
  bagletWeightG: number;
  bagletStatusCounts: Record<string, number>;
  createdBy: string;
  createdAt: string;
  baglets: Array<{
    id: string;
    batchId: string;
    sequence: number;
    status: string;
    statusUpdatedAt: string;
    weight: number | null;
    temperature: number | null;
    humidity: number | null;
    ph?: number | null;
    createdAt: string;
  }>;
}
