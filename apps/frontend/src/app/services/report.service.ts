import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { OfflineQueueService } from './offline-queue.service';
import { GeneratedReportResponse, QueuedReport } from '../models/report.model';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private authService = inject(AuthService);
  private offlineQueue = inject(OfflineQueueService);

  private get apiUrl(): string {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      return '/api/reports/process';
    }
    return 'http://localhost:3000/api/reports/process';
  }

  constructor() {
    // Register auto sync handler with offline queue service
    this.offlineQueue.registerSyncHandler(async (queuedReport) => {
      try {
        await this.sendReportToBackend(
          queuedReport.audioBlob,
          queuedReport.photoBlob,
          queuedReport.latitude,
          queuedReport.longitude,
          queuedReport.userNotes
        );
        return true;
      } catch (err) {
        console.error('[Report Service] Sync failed for queued item:', err);
        return false;
      }
    });
  }

  async submitReport(
    audioBlob?: Blob | null,
    photoBlob?: Blob | null,
    latitude?: number | null,
    longitude?: number | null,
    userNotes?: string,
    locationName?: string | null
  ): Promise<GeneratedReportResponse | { queued: boolean; queueId: number }> {
    // If offline, save directly to IndexedDB queue
    if (!this.offlineQueue.isOnline()) {
      const queueId = await this.offlineQueue.enqueueReport({
        audioBlob: audioBlob || undefined,
        audioMimeType: audioBlob?.type,
        photoBlob: photoBlob || undefined,
        photoMimeType: photoBlob?.type,
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        userNotes: userNotes || ''
      });
      return { queued: true, queueId };
    }

    try {
      return await this.sendReportToBackend(audioBlob, photoBlob, latitude, longitude, userNotes, locationName);
    } catch (error) {
      console.warn('[Report Service] Erro de rede ao enviar. Salvando na fila offline...', error);
      const queueId = await this.offlineQueue.enqueueReport({
        audioBlob: audioBlob || undefined,
        audioMimeType: audioBlob?.type,
        photoBlob: photoBlob || undefined,
        photoMimeType: photoBlob?.type,
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        userNotes: userNotes || ''
      });
      return { queued: true, queueId };
    }
  }

  private async sendReportToBackend(
    audioBlob?: Blob | null,
    photoBlob?: Blob | null,
    latitude?: number | null,
    longitude?: number | null,
    userNotes?: string,
    locationName?: string | null
  ): Promise<GeneratedReportResponse> {
    const formData = new FormData();

    if (audioBlob) {
      const ext = audioBlob.type.includes('webm') ? 'webm' : 'wav';
      formData.append('audio', audioBlob, `report-audio.${ext}`);
    }

    if (photoBlob) {
      const ext = photoBlob.type.includes('png') ? 'png' : 'jpg';
      formData.append('photo', photoBlob, `report-photo.${ext}`);
    }

    if (latitude !== undefined && latitude !== null) {
      formData.append('latitude', latitude.toString());
    }

    if (longitude !== undefined && longitude !== null) {
      formData.append('longitude', longitude.toString());
    }

    if (locationName) {
      formData.append('locationName', locationName);
    }

    if (userNotes) {
      formData.append('userNotes', userNotes);
    }

    const destEmail = this.authService.destinationEmail();
    if (destEmail) {
      formData.append('destinationEmail', destEmail);
    }

    const token = this.authService.token() || 'dev-token';

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({ error: 'Erro de comunicação com o servidor' }));
      throw new Error(errorJson.error || `HTTP error ${response.status}`);
    }

    return await response.json();
  }
}
