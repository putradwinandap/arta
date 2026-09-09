import Dexie, { type EntityTable } from 'dexie';

export type LocalCapture = {
  id: string;
  createdAt: string;
  syncStatus: 'pending' | 'synced' | 'failed';
};

class ArtaLocalDatabase extends Dexie {
  captures!: EntityTable<LocalCapture, 'id'>;

  constructor() {
    super('arta');
    this.version(1).stores({
      captures: 'id, createdAt, syncStatus'
    });
  }
}

export const localDb = new ArtaLocalDatabase();
