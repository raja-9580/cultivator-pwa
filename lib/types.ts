

// Baglet Status enum
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
  REPINNED_1 = 'REPINNED_1',
  REHARVESTED_1 = 'REHARVESTED_1',
  REPINNED_2 = 'REPINNED_2',
  REHARVESTED_2 = 'REHARVESTED_2',
  REPINNED_3 = 'REPINNED_3',
  REHARVESTED_3 = 'REHARVESTED_3',
  REPINNED_4 = 'REPINNED_4',
  REHARVESTED_4 = 'REHARVESTED_4',
  CONTAMINATED = 'CONTAMINATED',
  CRC_ANALYZED = 'CRC_ANALYZED',
  DISPOSED = 'DISPOSED',
  RECYCLED = 'RECYCLED',
  DAMAGED = 'DAMAGED',
  DELETED = 'DELETED',
}

// Mushroom types
export const MUSHROOM_TYPES = [
  'Golden Oyster',
  'Elm Oyster',
  'Blue Oyster',
  'King Oyster',
  'Shiitake',
  'Lion\'s Mane',
] as const;

export type MushroomType = typeof MUSHROOM_TYPES[number];

// Core Entities
export interface Batch {
  id: string;
  mushroomType: MushroomType;
  substrateCode: string;
  substrateDescription: string;
  plannedBagletCount: number;
  actualBagletCount: number;
  createdDate: Date;
  preparedDate: Date;
  notes?: string;
  bagletStatusCounts?: Record<string, number>;
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
