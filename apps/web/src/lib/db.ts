import Dexie, { type EntityTable } from 'dexie';

export type LocalCapture = {
  id: string;
  householdId: string;
  amountMinor: number;
  note: string;
  capturedAt: string;
  syncStatus: 'pending' | 'failed';
};

class ArtaLocalDatabase extends Dexie {
  captures!: EntityTable<LocalCapture, 'id'>;

  constructor() {
    super('arta');
    this.version(1).stores({
      captures: 'id, createdAt, syncStatus'
    });
    this.version(2).stores({
      captures: 'id, householdId, capturedAt, syncStatus'
    });
  }
}

export const localDb = new ArtaLocalDatabase();
