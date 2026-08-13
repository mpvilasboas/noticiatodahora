import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AudioRecorderService } from '../../services/audio-recorder.service';
import { LocationService } from '../../services/location.service';
import { ReportService } from '../../services/report.service';
import { OfflineQueueService } from '../../services/offline-queue.service';
import { GeneratedReportResponse } from '../../models/report.model';
import DOMPurify from 'dompurify';

@Component({
  selector: 'app-report-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="report-form-container">
      
      <!-- Network Warning Banner when offline -->
      <div *ngIf="!offlineQueue.isOnline()" class="offline-banner">
        <span>Modo Offline: Os arquivos serão armazenados e enviados quando reestabelecer conexão.</span>
      </div>

      <div class="form-card">
        
        <!-- SECTION 1: Audio Recording -->
        <div class="form-section">
          <label class="section-title">RELATO EM ÁUDIO</label>
          
          <div class="recorder-box">
            <!-- Recording Controls -->
            <div *ngIf="!recorder.audioUrl()" class="recording-controls">
              <button 
                type="button" 
                class="btn-record" 
                [class.recording]="recorder.isRecording()"
                (click)="toggleRecording()"
              >
                <svg *ngIf="!recorder.isRecording()" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="22"/>
                </svg>
                <span class="rec-dot" *ngIf="recorder.isRecording()"></span>
                <span class="btn-text">
                  {{ recorder.isRecording() ? (recorder.isPaused() ? 'Continuar Gravação' : 'Pausar Gravação') : 'Iniciar Gravação de Áudio' }}
                </span>
              </button>

              <div *ngIf="recorder.isRecording()" class="recording-timer">
                <span class="timer-value">{{ recorder.formatTime(recorder.recordingTimeSeconds()) }}</span>
                <button type="button" class="btn-stop" (click)="recorder.stopRecording()">Concluir Áudio</button>
              </div>
            </div>

            <!-- Audio Preview Player -->
            <div *ngIf="recorder.audioUrl()" class="audio-preview">
              <div class="audio-info">
                <span>Áudio gravado ({{ recorder.formatTime(recorder.recordingTimeSeconds()) }})</span>
                <button type="button" class="btn-clear" (click)="recorder.clearRecording()">Gravar novamente</button>
              </div>
              <audio [src]="recorder.audioUrl()" controls class="audio-player"></audio>
            </div>
          </div>
        </div>

        <!-- SECTION 2: Image Capture -->
        <div class="form-section">
          <label class="section-title">FOTO DA OCORRÊNCIA</label>
          
          <div class="photo-box">
            <input 
              type="file" 
              #fileInput 
              accept="image/*" 
              capture="environment" 
              style="display: none;" 
              (change)="onPhotoSelected($event)"
            />

            <button type="button" class="btn-photo" (click)="fileInput.click()">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <span>{{ photoPreview() ? 'Substituir Foto' : 'Adicionar Foto ou Imagem' }}</span>
            </button>

            <div *ngIf="photoPreview()" class="photo-preview-container">
              <img [src]="photoPreview()" alt="Preview da Foto" class="photo-preview" />
              <button type="button" class="btn-remove-photo" (click)="clearPhoto()">Remover</button>
            </div>
          </div>
        </div>

        <!-- SECTION 3: Geolocation -->
        <div class="form-section">
          <label class="section-title">LOCALIZAÇÃO GPS</label>
          
          <div class="location-box">
            <div *ngIf="locationService.location().loading" class="loc-status">
              Obtendo coordenadas via GPS...
            </div>

            <div *ngIf="locationService.location().locationName" class="loc-success">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span>{{ locationService.location().locationName }}</span>
            </div>

            <div *ngIf="locationService.location().error" class="loc-error">
              {{ locationService.location().error }}
            </div>

            <button type="button" class="btn-location" (click)="locationService.fetchCurrentLocation()">
              Atualizar Posição
            </button>
          </div>
        </div>

        <!-- 4. TEXT / NOTES -->
        <div class="form-section section-notes">
          <label class="section-title">OBSERVAÇÕES E DETALHES</label>
          <textarea 
            class="notes-input" 
            [(ngModel)]="userNotes" 
            placeholder="Nomes completos, cargos, números ou detalhes essenciais..."
            rows="2"
          ></textarea>
        </div>

        <!-- SUBMIT BUTTON -->
        <div class="submit-section">
          <button 
            type="button" 
            class="btn-submit-report" 
            [disabled]="isSubmitting() || (!recorder.audioBlob() && !userNotes)"
            (click)="submitReport()"
          >
            <span *ngIf="!isSubmitting()">Enviar para Redação →</span>
            <span *ngIf="isSubmitting()">Processando...</span>
          </button>
          <span class="submit-hint">
            Gerando matéria completa para portal web e boletim formatado para rádio.
          </span>
        </div>

      </div>

      <!-- SUCCESS / RESULT OVERLAY -->
      <div *ngIf="resultReport()" class="result-modal-backdrop" (click)="resetForm()">
        <div class="result-modal" (click)="$event.stopPropagation()">
          <div class="modal-status-tag">✓ ENVIADO COM SUCESSO</div>
          <h3>Reportagem Processada</h3>
          <p class="modal-sub">
            O material foi gravado e enviado para a redação.
          </p>

          <div class="result-tabs" *ngIf="resultReport()?.report">
            <div class="result-card" *ngIf="getPortalArticle()">
              <span class="card-tag">PORTAL WEB</span>
              <h5>{{ getPortalArticle()?.headline }}</h5>
              <p *ngIf="getPortalArticle()?.lead" class="lead-text"><strong>Lead:</strong> {{ getPortalArticle()?.lead }}</p>
              <div class="markdown-preview">
                <pre>{{ getPortalArticle()?.bodyMarkdown }}</pre>
              </div>
            </div>

            <div class="result-card radio" *ngIf="getRadioScript()">
              <div class="card-header-flex">
                <span class="card-tag radio-tag">ROTEIRO RÁDIO</span>
                <span class="duration">Leitura: ~{{ getRadioScript()?.durationEstimateSeconds || 40 }}s</span>
              </div>
              <h5>{{ getRadioScript()?.title }}</h5>
              <p class="radio-body">{{ getRadioScript()?.broadcastScript }}</p>
            </div>
          </div>

          <button type="button" class="btn-close-modal" (click)="resetForm()">
            + Criar Nova Reportagem
          </button>
        </div>
      </div>

      <!-- QUEUED SUCCESS OVERLAY -->
      <div *ngIf="queuedSuccessMessage()" class="result-modal-backdrop" (click)="resetForm()">
        <div class="result-modal" (click)="$event.stopPropagation()">
          <div class="modal-status-tag offline-tag">ARMAZENADO NA FILA</div>
          <h3>Reportagem Salva Offline</h3>
          <p class="modal-sub">
            Seu áudio e dados foram salvos no dispositivo e serão transmitidos automaticamente assim que a conexão retornar.
          </p>
          <button type="button" class="btn-close-modal" (click)="resetForm()">
            Concluído
          </button>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .report-form-container {
      max-width: 500px;
      width: 100%;
      height: 100%;
      flex: 1;
      margin: 0 auto;
      padding: 10px 14px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow-y: auto;
      box-sizing: border-box;
      background-color: #09090b;
    }

    .offline-banner {
      background-color: #271a0c;
      border: 1px solid #b45309;
      color: #fde047;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 12px;
      margin-bottom: 8px;
      line-height: 1.4;
    }

    .form-card {
      background: #121215;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.6);
      border: 1px solid #27272a;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      flex: 1;
    }

    .form-section {
      margin-bottom: 12px;
    }

    .form-section.section-notes {
      flex: 1;
      display: flex;
      flex-direction: column;
      margin-bottom: 12px;
    }

    .section-title {
      display: block;
      font-size: 11px;
      font-weight: 600;
      color: #71717a;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 6px;
    }

    .recorder-box, .photo-box, .location-box {
      background-color: #18181b;
      border: 1px solid #27272a;
      border-radius: 8px;
      padding: 10px 12px;
    }

    .btn-record {
      width: 100%;
      padding: 12px 14px;
      background-color: #ef4444;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
      transition: background-color 0.15s;
    }

    .btn-record:hover {
      background-color: #dc2626;
    }

    .btn-record.recording {
      background-color: #dc2626;
    }

    .rec-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #ffffff;
      animation: pulse 1.2s infinite;
    }

    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.3; }
      100% { opacity: 1; }
    }

    .recording-timer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
      font-size: 13px;
      font-weight: 600;
      color: #ef4444;
    }

    .btn-stop {
      background-color: #27272a;
      color: #ffffff;
      border: 1px solid #3f3f46;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
    }

    .audio-preview {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .audio-info {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      font-weight: 500;
      color: #4ade80;
    }

    .btn-clear {
      background: none;
      border: none;
      color: #f87171;
      font-size: 12px;
      cursor: pointer;
    }

    .audio-player {
      width: 100%;
      height: 38px;
      filter: invert(0.9) hue-rotate(180deg);
    }

    .btn-photo, .btn-location {
      width: 100%;
      padding: 10px 12px;
      background-color: #18181b;
      border: 1px solid #27272a;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      color: #e4e4e7;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
      transition: background-color 0.15s;
    }

    .btn-photo:hover, .btn-location:hover {
      background-color: #27272a;
    }

    .photo-preview-container {
      margin-top: 8px;
      position: relative;
    }

    .photo-preview {
      width: 100%;
      max-height: 90px;
      object-fit: cover;
      border-radius: 6px;
      border: 1px solid #27272a;
    }

    .btn-remove-photo {
      position: absolute;
      top: 6px;
      right: 6px;
      background: rgba(0,0,0,0.85);
      color: #fff;
      border: 1px solid #3f3f46;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      cursor: pointer;
    }

    .loc-status, .loc-success, .loc-error {
      font-size: 13px;
      margin-bottom: 6px;
      font-weight: 500;
    }

    .loc-success {
      color: #4ade80;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .loc-error { color: #f87171; }

    .notes-input {
      width: 100%;
      flex: 1;
      min-height: 70px;
      padding: 10px 12px;
      background-color: #18181b;
      border: 1px solid #27272a;
      border-radius: 8px;
      font-size: 13px;
      line-height: 1.45;
      color: #ffffff;
      box-sizing: border-box;
      outline: none;
      resize: none;
      transition: border-color 0.15s;
    }

    .notes-input::placeholder {
      color: #71717a;
    }

    .notes-input:focus {
      border-color: #52525b;
    }

    .submit-section {
      margin-top: 6px;
    }

    .btn-submit-report {
      width: 100%;
      padding: 13px;
      background-color: #ffffff;
      color: #09090b;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(255, 255, 255, 0.12);
      transition: background-color 0.15s;
    }

    .btn-submit-report:hover {
      background-color: #e4e4e7;
    }

    .btn-submit-report:disabled {
      background-color: #27272a;
      color: #71717a;
      box-shadow: none;
      cursor: not-allowed;
    }

    .submit-hint {
      display: block;
      text-align: center;
      font-size: 11px;
      color: #71717a;
      margin-top: 6px;
    }

    /* Modal Backdrop */
    .result-modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      z-index: 200;
    }

    .result-modal {
      background: #09090b;
      border-radius: 12px;
      padding: 24px;
      width: 100%;
      max-width: 500px;
      max-height: 85vh;
      overflow-y: auto;
      text-align: left;
      border: 1px solid #27272a;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.9);
      color: #f4f4f5;
    }

    .modal-status-tag {
      display: inline-block;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.05em;
      color: #4ade80;
      background-color: #052e16;
      border: 1px solid #166534;
      padding: 3px 8px;
      border-radius: 4px;
      margin-bottom: 10px;
    }

    .offline-tag {
      color: #fde047;
      background-color: #271a0c;
      border-color: #b45309;
    }

    .result-modal h3 { margin: 0 0 6px 0; color: #ffffff; font-size: 18px; font-weight: 600; }
    .modal-sub { font-size: 13px; color: #a1a1aa; margin-bottom: 20px; line-height: 1.4; }

    .result-tabs { text-align: left; margin-bottom: 20px; display: flex; flex-direction: column; gap: 12px; }
    
    .result-card { background: #121215; border: 1px solid #27272a; border-radius: 8px; padding: 14px; }
    .result-card.radio { background: #0c192c; border-color: #1e3a8a; }

    .card-header-flex {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .card-tag {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.05em;
      color: #a1a1aa;
    }

    .radio-tag { color: #38bdf8; }

    .result-card h5 { margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #ffffff; }
    .lead-text { font-size: 13px; margin: 0 0 10px 0; color: #d4d4d8; line-height: 1.45; }
    
    .markdown-preview pre {
      font-size: 12px;
      white-space: pre-wrap;
      background: #09090b;
      color: #e4e4e7;
      padding: 10px;
      border-radius: 6px;
      border: 1px solid #27272a;
      margin: 0;
    }

    .duration { font-size: 11px; font-weight: 500; color: #38bdf8; }
    .radio-body { font-size: 13px; color: #e4e4e7; line-height: 1.5; margin: 0; }

    .btn-close-modal {
      width: 100%;
      padding: 12px;
      background-color: #ffffff;
      color: #09090b;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      transition: background-color 0.15s;
    }

    .btn-close-modal:hover {
      background-color: #e4e4e7;
    }
  `]
})
export class ReportFormComponent implements OnInit {
  recorder = inject(AudioRecorderService);
  locationService = inject(LocationService);
  reportService = inject(ReportService);
  offlineQueue = inject(OfflineQueueService);

  photoFile: File | null = null;
  photoPreview = signal<string | null>(null);
  userNotes = '';

  isSubmitting = signal<boolean>(false);
  resultReport = signal<GeneratedReportResponse | null>(null);
  queuedSuccessMessage = signal<boolean>(false);

  ngOnInit(): void {
    this.locationService.fetchCurrentLocation();
  }

  toggleRecording(): void {
    if (!this.recorder.isRecording()) {
      this.recorder.startRecording();
    } else if (this.recorder.isPaused()) {
      this.recorder.resumeRecording();
    } else {
      this.recorder.pauseRecording();
    }
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.photoFile = file;

      const reader = new FileReader();
      reader.onload = (e) => {
        this.photoPreview.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  clearPhoto(): void {
    this.photoFile = null;
    this.photoPreview.set(null);
  }

  async submitReport(): Promise<void> {
    const audioBlob = this.recorder.audioBlob();
    if (!audioBlob && !this.userNotes.trim()) {
      alert('Por favor, grave um relato de áudio ou digite algumas observações antes de enviar.');
      return;
    }

    this.isSubmitting.set(true);

    const lat = this.locationService.location().latitude;
    const lng = this.locationService.location().longitude;
    const locationName = this.locationService.location().locationName;

    try {
      if (!this.offlineQueue.isOnline()) {
        await this.offlineQueue.enqueueReport({
          audioBlob: audioBlob || undefined,
          photoBlob: this.photoFile || undefined,
          latitude: lat || undefined,
          longitude: lng || undefined,
          userNotes: this.userNotes.trim() || undefined
        });
        this.queuedSuccessMessage.set(true);
      } else {
        const response = await this.reportService.submitReport(
          audioBlob,
          this.photoFile,
          lat,
          lng,
          this.userNotes.trim() || undefined,
          locationName
        );

        if ('queued' in response && response.queued) {
          this.queuedSuccessMessage.set(true);
        } else {
          this.resultReport.set(response as GeneratedReportResponse);
        }
      }
    } catch (err: any) {
      console.error('Erro no envio, salvando na fila offline:', err);
      try {
        await this.offlineQueue.enqueueReport({
          audioBlob: audioBlob || undefined,
          photoBlob: this.photoFile || undefined,
          latitude: lat || undefined,
          longitude: lng || undefined,
          userNotes: this.userNotes.trim() || undefined
        });
        this.queuedSuccessMessage.set(true);
      } catch (queueErr) {
        alert('Erro ao processar e salvar a notícia. Verifique as permissões de mídia.');
      }
    } finally {
      this.isSubmitting.set(false);
    }
  }

  resetForm(): void {
    this.recorder.clearRecording();
    this.clearPhoto();
    this.userNotes = '';
    this.resultReport.set(null);
    this.queuedSuccessMessage.set(false);
  }

  getPortalArticle() {
    const report = this.resultReport()?.report;
    if (!report || !report.portal_article) return null;
    const article = report.portal_article;
    return {
      headline: DOMPurify.sanitize(article.headline),
      lead: DOMPurify.sanitize(article.lead),
      bodyMarkdown: DOMPurify.sanitize(article.bodyMarkdown),
      photoCaption: article.photoCaption ? DOMPurify.sanitize(article.photoCaption) : '',
      tags: article.tags ? article.tags.map(t => DOMPurify.sanitize(t)) : []
    };
  }

  getRadioScript() {
    const report = this.resultReport()?.report;
    if (!report || !report.radio_script) return null;
    const script = report.radio_script;
    return {
      title: DOMPurify.sanitize(script.title),
      broadcastScript: DOMPurify.sanitize(script.broadcastScript),
      durationEstimateSeconds: script.durationEstimateSeconds
    };
  }
}
