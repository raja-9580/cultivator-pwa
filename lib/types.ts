// Batch Status enum
export enum BatchStatus {
  Planned = 'Planned',
  Sterilized = 'Sterilized',
  Inoculated = 'Inoculated',
  Colonising = 'Colonising',
  InProgress = 'In Progress',
  ReadyToHarvest = 'Ready to Harvest',
  Archived = 'Archived',
}

// Baglet Status enum
export enum BagletStatus {
  Planned = 'Planned',
  Sterilized = 'Sterilized',
  Inoculated = 'Inoculated',
  Colonising = 'Colonising',
  ReadyToHarvest = 'Ready to Harvest',
  Harvested = 'Harvested',
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
  status: BatchStatus;
  createdDate: Date;
  preparedDate: Date;
  notes?: string;
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
