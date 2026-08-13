import { Injectable, signal } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { QueuedReport } from '../models/report.model';

class NoticiaDatabase extends Dexie {
  queuedReports!: Table<QueuedReport, number>;

  constructor() {
    super('NoticiaTodaHoraDB');
    this.version(1).stores({
      queuedReports: '++id, createdAt'
    });
  }
}

@Injectable({
  providedIn: 'root'
})
export class OfflineQueueService {
  private db = new NoticiaDatabase();

  isOnline = signal<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  pendingCount = signal<number>(0);
  isSyncing = signal<boolean>(false);

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline.set(true);
        console.log('[Offline Queue] Dispositivo online. Tentando sincronizar fila...');
        this.triggerAutoSync();
      });

      window.addEventListener('offline', () => {
        this.isOnline.set(false);
        console.log('[Offline Queue] Dispositivo offline.');
      });
    }

    this.updatePendingCount();
  }

  async enqueueReport(report: Omit<QueuedReport, 'id' | 'createdAt'>): Promise<number> {
    const queuedItem: QueuedReport = {
      ...report,
      createdAt: new Date().toISOString()
    };
    const id = await this.db.queuedReports.add(queuedItem);
    await this.updatePendingCount();
    console.log(`[Offline Queue] Reportagem nº ${id} salva na fila offline do celular.`);
    return id;
  }

  async getQueuedReports(): Promise<QueuedReport[]> {
    return await this.db.queuedReports.toArray();
  }

  async removeReport(id: number): Promise<void> {
    await this.db.queuedReports.delete(id);
    await this.updatePendingCount();
  }

  async updatePendingCount(): Promise<void> {
    try {
      const count = await this.db.queuedReports.count();
      this.pendingCount.set(count);
    } catch (e) {
      console.warn('[Offline Queue] Could not access IndexedDB count:', e);
    }
  }

  onSyncHandler: ((report: QueuedReport) => Promise<boolean>) | null = null;

  registerSyncHandler(handler: (report: QueuedReport) => Promise<boolean>): void {
    this.onSyncHandler = handler;
  }

  async triggerAutoSync(): Promise<void> {
    if (!this.isOnline() || this.isSyncing() || !this.onSyncHandler) {
      return;
    }

    const items = await this.getQueuedReports();
    if (items.length === 0) return;

    this.isSyncing.set(true);
    console.log(`[Offline Queue] Iniciando sincronização de ${items.length} reportagens pendentes...`);

    for (const item of items) {
      try {
        const success = await this.onSyncHandler(item);
        if (success && item.id) {
          await this.removeReport(item.id);
          console.log(`[Offline Queue] Reportagem nº ${item.id} enviada e removida da fila.`);
        }
      } catch (err) {
        console.error(`[Offline Queue] Falha ao enviar item ${item.id}:`, err);
        break;
      }
    }

    this.isSyncing.set(false);
  }
}
