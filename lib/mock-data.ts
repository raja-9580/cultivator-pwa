import { Batch, Baglet, BatchStatus, BagletStatus, Metric, HarvestEntry } from './types';

// Mock Batches
export const mockBatches: Batch[] = [
  {
    id: 'FPR-24092025-B01',
    mushroomType: 'Golden Oyster',
    substrateCode: 'GEN-STW-001',
    substrateDescription: 'Straw & Gypsum Mix',
    plannedBagletCount: 50,
    actualBagletCount: 48,
    status: BatchStatus.Colonising,
    createdDate: new Date('2025-09-24'),
    preparedDate: new Date('2025-09-24'),
    notes: 'Primary batch for Q3',
  },
  {
    id: 'FPR-25092025-B02',
    mushroomType: 'Elm Oyster',
    substrateCode: 'ELM-OAK-002',
    substrateDescription: 'Oak Chips & Sawdust',
    plannedBagletCount: 35,
    actualBagletCount: 35,
    status: BatchStatus.Inoculated,
    createdDate: new Date('2025-09-25'),
    preparedDate: new Date('2025-09-25'),
  },
  {
    id: 'FPR-26092025-B03',
    mushroomType: 'Blue Oyster',
    substrateCode: 'BLU-STW-003',
    substrateDescription: 'Straw & Gypsum Mix',
    plannedBagletCount: 40,
    actualBagletCount: 40,
    status: BatchStatus.ReadyToHarvest,
    createdDate: new Date('2025-09-26'),
    preparedDate: new Date('2025-09-26'),
  },
  {
    id: 'FPR-27092025-B04',
    mushroomType: 'Shiitake',
    substrateCode: 'SHI-OAK-004',
    substrateDescription: 'Oak Dowels',
    plannedBagletCount: 25,
    actualBagletCount: 25,
    status: BatchStatus.Sterilized,
    createdDate: new Date('2025-09-27'),
    preparedDate: new Date('2025-09-27'),
  },
  {
    id: 'FPR-23092025-B05',
    mushroomType: 'Lion\'s Mane',
    substrateCode: 'LMN-OAK-005',
    substrateDescription: 'Oak Chips & Sawdust',
    plannedBagletCount: 30,
    actualBagletCount: 28,
    status: BatchStatus.Planned,
    createdDate: new Date('2025-09-23'),
    preparedDate: new Date('2025-09-23'),
  },
  {
    id: 'FPR-22092025-B06',
    mushroomType: 'King Oyster',
    substrateCode: 'KGO-STW-006',
    substrateDescription: 'Straw & Gypsum Mix',
    plannedBagletCount: 45,
    actualBagletCount: 43,
    status: BatchStatus.Archived,
    createdDate: new Date('2025-09-22'),
    preparedDate: new Date('2025-09-22'),
  },
];

// Mock Baglets
export const mockBaglets: Baglet[] = [
  // Batch 1 baglets
  {
    id: 'BGL-FPR-24092025-B01-001',
    batchId: 'FPR-24092025-B01',
    status: BagletStatus.Colonising,
    lastStatusChange: new Date('2025-09-28'),
    metrics: {
      temperature: 23.5,
      humidity: 85,
      co2Level: 1200,
      lightLevel: 500,
      recordedAt: new Date('2025-09-29T14:30:00'),
    },
  },
  {
    id: 'BGL-FPR-24092025-B01-002',
    batchId: 'FPR-24092025-B01',
    status: BagletStatus.Colonising,
    lastStatusChange: new Date('2025-09-28'),
    metrics: {
      temperature: 23.8,
      humidity: 84,
      co2Level: 1150,
      lightLevel: 480,
      recordedAt: new Date('2025-09-29T14:30:00'),
    },
  },
  {
    id: 'BGL-FPR-24092025-B01-003',
    batchId: 'FPR-24092025-B01',
    status: BagletStatus.Colonising,
    lastStatusChange: new Date('2025-09-27'),
    metrics: {
      temperature: 23.2,
      humidity: 86,
      co2Level: 1250,
      lightLevel: 520,
      recordedAt: new Date('2025-09-29T14:30:00'),
    },
  },
  // Batch 2 baglets
  {
    id: 'BGL-FPR-25092025-B02-001',
    batchId: 'FPR-25092025-B02',
    status: BagletStatus.Inoculated,
    lastStatusChange: new Date('2025-09-26'),
    metrics: {
      temperature: 22.5,
      humidity: 80,
      co2Level: 800,
      lightLevel: 200,
      recordedAt: new Date('2025-09-29T14:30:00'),
    },
  },
  {
    id: 'BGL-FPR-25092025-B02-002',
    batchId: 'FPR-25092025-B02',
    status: BagletStatus.Inoculated,
    lastStatusChange: new Date('2025-09-26'),
    metrics: {
      temperature: 22.8,
      humidity: 81,
      co2Level: 820,
      lightLevel: 210,
      recordedAt: new Date('2025-09-29T14:30:00'),
    },
  },
  // Batch 3 baglets (Ready to Harvest)
  {
    id: 'BGL-FPR-26092025-B03-001',
    batchId: 'FPR-26092025-B03',
    status: BagletStatus.ReadyToHarvest,
    lastStatusChange: new Date('2025-09-29'),
    metrics: {
      temperature: 18.5,
      humidity: 90,
      co2Level: 1500,
      lightLevel: 800,
      recordedAt: new Date('2025-09-29T14:30:00'),
    },
  },
  // Batch 4 baglets (Sterilized - waiting for inoculation)
  {
    id: 'BGL-FPR-27092025-B04-001',
    batchId: 'FPR-27092025-B04',
    status: BagletStatus.Sterilized,
    lastStatusChange: new Date('2025-09-27'),
  },
];

// Mock Metrics
export const mockMetrics: Metric[] = [
  {
    temperature: 23.5,
    humidity: 85,
    co2Level: 1200,
    lightLevel: 500,
    recordedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    temperature: 23.2,
    humidity: 86,
    co2Level: 1250,
    lightLevel: 520,
    recordedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
  },
  {
    temperature: 23.8,
    humidity: 84,
    co2Level: 1150,
    lightLevel: 480,
    recordedAt: new Date(),
  },
];

// Mock Harvest Entries
export const mockHarvestEntries: HarvestEntry[] = [
  {
    id: 'HRV-001',
    batchId: 'FPR-22092025-B06',
    bagletId: 'BGL-FPR-22092025-B06-001',
    weight: 450,
    harvestDate: new Date('2025-09-28'),
    notes: 'First flush, good quality',
  },
  {
    id: 'HRV-002',
    batchId: 'FPR-22092025-B06',
    bagletId: 'BGL-FPR-22092025-B06-002',
    weight: 420,
    harvestDate: new Date('2025-09-28'),
    notes: 'First flush',
  },
  {
    id: 'HRV-003',
    batchId: 'FPR-23092025-B05',
    bagletId: 'BGL-FPR-23092025-B05-001',
    weight: 380,
    harvestDate: new Date('2025-09-29'),
  },
];
