import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AudioRecorderService } from '../../services/audio-recorder.service';
import { LocationService } from '../../services/location.service';
import { ReportService } from '../../services/report.service';
import { OfflineQueueService } from '../../services/offline-queue.service';
import { GeneratedReportResponse } from '../../models/report.model';

@Component({
  selector: 'app-report-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="report-form-container">
      
      <!-- Network Warning Banner when offline -->
      <div *ngIf="!offlineQueue.isOnline()" class="offline-banner">
        ⚠️ <strong>Modo Offline Ativo:</strong> Suas mídias serão salvas com segurança no celular e enviadas automaticamente quando houver conexão.
      </div>

      <div class="form-card">
        
        <!-- SECTION 1: Audio Recording -->
        <div class="form-section">
          <label class="section-title">Relato (Áudio)</label>
          
          <div class="recorder-box">
            <!-- Recording Controls -->
            <div *ngIf="!recorder.audioUrl()" class="recording-controls">
              <button 
                type="button" 
                class="btn-record" 
                [class.recording]="recorder.isRecording()"
                (click)="toggleRecording()"
              >
                <span class="mic-icon">{{ recorder.isRecording() ? '🔴' : '🎙️' }}</span>
                <span class="btn-text">
                  {{ recorder.isRecording() ? (recorder.isPaused() ? 'Continuar Gravação' : 'Pausar Gravação') : 'Iniciar Gravação de Áudio' }}
                </span>
              </button>

              <div *ngIf="recorder.isRecording()" class="recording-timer">
                ⏱️ {{ recorder.formatTime(recorder.recordingTimeSeconds()) }}
                <button type="button" class="btn-stop" (click)="recorder.stopRecording()">Concluir Áudio</button>
              </div>
            </div>

            <!-- Audio Preview Player -->
            <div *ngIf="recorder.audioUrl()" class="audio-preview">
              <div class="audio-info">
                <span>✅ Áudio gravado ({{ recorder.formatTime(recorder.recordingTimeSeconds()) }})</span>
                <button type="button" class="btn-clear" (click)="recorder.clearRecording()">❌ Gravador novamente</button>
              </div>
              <audio [src]="recorder.audioUrl()" controls class="audio-player"></audio>
            </div>
          </div>
        </div>

        <!-- SECTION 2: Image Capture -->
        <div class="form-section">
          <label class="section-title">Imagem (Opcional)</label>
          
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
              📷 {{ photoPreview() ? 'Trocar Foto Capturada' : 'Tirar Foto ou Escolher Imagem' }}
            </button>

            <div *ngIf="photoPreview()" class="photo-preview-container">
              <img [src]="photoPreview()" alt="Preview da Foto" class="photo-preview" />
              <button type="button" class="btn-remove-photo" (click)="clearPhoto()">Remover</button>
            </div>
          </div>
        </div>

        <!-- SECTION 3: Geolocation -->
        <div class="form-section">
          <label class="section-title">Localização</label>
          
          <div class="location-box">
            <div *ngIf="locationService.location().loading" class="loc-status">
              🔄 Obtendo localização...
            </div>

            <div *ngIf="locationService.location().locationName" class="loc-success">
              📍 {{ locationService.location().locationName }}
            </div>

            <div *ngIf="locationService.location().error" class="loc-error">
              ⚠️ {{ locationService.location().error }}
            </div>

            <button type="button" class="btn-location" (click)="locationService.fetchCurrentLocation()">
              Atualizar localização
            </button>
          </div>
        </div>

        <!-- 4. TEXT / NOTES -->
        <div class="form-section section-notes">
          <label class="section-title">Informações Adicionais (Opcional)</label>
          <p class="section-help">Insira aqui dados específicos que precisam constar no texto final: nomes completos das pessoas envolvidas, cargos, instituições ou detalhes essenciais.</p>
          <textarea 
            class="notes-input" 
            [(ngModel)]="userNotes" 
            placeholder="Ex: João da Silva (Diretor da Defesa Civil), 15 famílias afetadas, entrevista concedida às 14h..."
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
            <span *ngIf="!isSubmitting()">🚀 Enviar Notícia à Redação</span>
            <span *ngIf="isSubmitting()">⏳ Processando com IA...</span>
          </button>
          <span class="submit-hint">
            O relato será transcrito por IA e enviado direto ao sistema da redação em formato de matéria e roteiro de rádio.
          </span>
        </div>

      </div>

      <!-- SUCCESS / RESULT OVERLAY -->
      <div *ngIf="resultReport()" class="result-modal-backdrop" (click)="resetForm()">
        <div class="result-modal" (click)="$event.stopPropagation()">
          <div class="modal-icon">🎉</div>
          <h3>Reportagem enviada</h3>
          <p class="modal-sub">
            O material foi processado com sucesso e está salvo no banco de dados com status <strong>enviado_redacao</strong>.
          </p>

          <div class="result-tabs" *ngIf="resultReport()?.report">
            <div class="result-card" *ngIf="getPortalArticle()">
              <h4>📰 Matéria do site</h4>
              <h5>{{ getPortalArticle()?.headline }}</h5>
              <p *ngIf="getPortalArticle()?.lead"><strong>Lead:</strong> {{ getPortalArticle()?.lead }}</p>
              <div class="markdown-preview">
                <pre>{{ getPortalArticle()?.bodyMarkdown }}</pre>
              </div>
            </div>

            <div class="result-card radio" *ngIf="getRadioScript()">
              <h4>📻 Roteiro para rádio</h4>
              <h5>{{ getRadioScript()?.title }}</h5>
              <p class="radio-body">{{ getRadioScript()?.broadcastScript }}</p>
              <span class="duration">⏱️ Duração estimada: {{ getRadioScript()?.durationEstimateSeconds || 40 }}s</span>
            </div>
          </div>

          <button type="button" class="btn-close-modal" (click)="resetForm()">
            + Enviar Nova Reportagem de Campo
          </button>
        </div>
      </div>

      <!-- QUEUED SUCCESS OVERLAY -->
      <div *ngIf="queuedSuccessMessage()" class="result-modal-backdrop" (click)="resetForm()">
        <div class="result-modal" (click)="$event.stopPropagation()">
          <div class="modal-icon">📥</div>
          <h3>Reportagem Salva na Fila Offline!</h3>
          <p class="modal-sub">
            Você está sem conexão no momento. Seu relato, fotos e coordenadas foram salvos com segurança no dispositivo e serão **enviados automaticamente** assim que o sinal for restabelecido.
          </p>
          <button type="button" class="btn-close-modal" (click)="resetForm()">
            Entendido (+ Nova Reportagem)
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
    }

    .offline-banner {
      background-color: #fffbebfb;
      border: 1px solid #f59e0b;
      color: #92400e;
      padding: 8px 12px;
      border-radius: 10px;
      font-size: 12px;
      margin-bottom: 8px;
      line-height: 1.4;
    }

    .form-card {
      background: #ffffff;
      border-radius: 16px;
      padding: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
      border: 1px solid #e2e8f0;
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
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 6px;
    }

    .section-help {
      font-size: 12px;
      color: #475569;
      margin: 0 0 8px 0;
      line-height: 1.4;
    }

    .step-num {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      background-color: #2563eb;
      color: #ffffff;
      border-radius: 50%;
      font-size: 12px;
      font-weight: 700;
    }

    .recorder-box, .photo-box, .location-box {
      background-color: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 12px;
      padding: 10px 12px;
    }

    .btn-record {
      width: 100%;
      padding: 13px 14px;
      background-color: #ef4444;
      color: #ffffff;
      border: none;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      cursor: pointer;
      box-shadow: 0 3px 10px rgba(239, 68, 68, 0.25);
      transition: transform 0.1s, background-color 0.2s;
    }

    .btn-record.recording {
      background-color: #dc2626;
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.8; }
      100% { opacity: 1; }
    }

    .recording-timer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
      font-size: 14px;
      font-weight: 700;
      color: #dc2626;
    }

    .btn-stop {
      background-color: #0f172a;
      color: #ffffff;
      border: none;
      padding: 5px 10px;
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
      font-weight: 600;
      color: #059669;
    }

    .btn-clear {
      background: none;
      border: none;
      color: #ef4444;
      font-size: 12px;
      cursor: pointer;
    }

    .audio-player {
      width: 100%;
      height: 38px;
    }

    .btn-photo, .btn-location {
      width: 100%;
      padding: 11px 12px;
      background-color: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      color: #334155;
      cursor: pointer;
    }

    .photo-preview-container {
      margin-top: 8px;
      position: relative;
    }

    .photo-preview {
      width: 100%;
      max-height: 90px;
      object-fit: cover;
      border-radius: 8px;
    }

    .btn-remove-photo {
      position: absolute;
      top: 6px;
      right: 6px;
      background: rgba(0,0,0,0.75);
      color: #fff;
      border: none;
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

    .loc-success { color: #059669; font-weight: 600; }
    .loc-error { color: #dc2626; }

    .notes-input {
      width: 100%;
      flex: 1;
      min-height: 70px;
      padding: 10px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      font-size: 14px;
      line-height: 1.45;
      color: #1e293b;
      box-sizing: border-box;
      outline: none;
      resize: none;
    }

    .submit-section {
      margin-top: 6px;
    }

    .btn-submit-report {
      width: 100%;
      padding: 15px;
      background-color: #10b981;
      color: #ffffff;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.28);
      transition: background-color 0.2s;
    }

    .btn-submit-report:hover {
      background-color: #059669;
    }

    .btn-submit-report:disabled {
      background-color: #94a3b8;
      box-shadow: none;
      cursor: not-allowed;
    }

    .submit-hint {
      display: block;
      text-align: center;
      font-size: 11px;
      color: #64748b;
      margin-top: 6px;
    }

    /* Modal Backdrop */
    .result-modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      z-index: 200;
    }

    .result-modal {
      background: #ffffff;
      border-radius: 20px;
      padding: 24px;
      width: 100%;
      max-width: 500px;
      max-height: 85vh;
      overflow-y: auto;
      text-align: center;
    }

    .modal-icon { font-size: 40px; margin-bottom: 8px; }
    .result-modal h3 { margin: 0 0 8px 0; color: #0f172a; font-size: 20px; }
    .modal-sub { font-size: 13px; color: #64748b; margin-bottom: 20px; }

    .result-tabs { text-align: left; margin-bottom: 20px; display: flex; flex-direction: column; gap: 12px; }
    .result-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; }
    .result-card.radio { background: #eff6ff; border-color: #bfdbfe; }
    .result-card h4 { margin: 0 0 6px 0; font-size: 14px; color: #2563eb; }
    .result-card h5 { margin: 0 0 6px 0; font-size: 15px; color: #0f172a; }
    .result-card p { font-size: 13px; margin: 0 0 8px 0; color: #334155; }
    .markdown-preview pre { font-size: 11px; white-space: pre-wrap; background: #ffffff; padding: 8px; border-radius: 6px; }
    .duration { font-size: 11px; font-weight: 600; color: #1d4ed8; }

    .btn-close-modal {
      width: 100%;
      padding: 14px;
      background-color: #0f172a;
      color: #fff;
      border: none;
      border-radius: 10px;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
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
    // Automatically fetch GPS when component loads
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

  onPhotoSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.photoFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.photoPreview.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  clearPhoto(): void {
    this.photoFile = null;
    this.photoPreview.set(null);
  }

  getPortalArticle() {
    const rep = this.resultReport()?.report as any;
    return rep?.portalArticle || rep?.portal_article || null;
  }

  getRadioScript() {
    const rep = this.resultReport()?.report as any;
    return rep?.radioScript || rep?.radio_script || null;
  }

  async submitReport(): Promise<void> {
    if (!this.recorder.audioBlob() && !this.userNotes) return;

    this.isSubmitting.set(true);

    try {
      const response = await this.reportService.submitReport(
        this.recorder.audioBlob(),
        this.photoFile,
        this.locationService.location().latitude,
        this.locationService.location().longitude,
        this.userNotes,
        this.locationService.location().locationName
      );

      if ('queued' in response && response.queued) {
        this.queuedSuccessMessage.set(true);
      } else if ('report' in response) {
        this.resultReport.set(response as GeneratedReportResponse);
      }
    } catch (err: any) {
      alert(`Falha ao enviar reportagem: ${err?.message || err}`);
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
    this.locationService.fetchCurrentLocation();
  }
}
