import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { OfflineQueueService } from '../../services/offline-queue.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header">
      <div class="logo-container">
        <span class="logo-icon">📻</span>
        <div class="logo-text">
          <h1>Notícia toda hora</h1>
          <span class="subhead">Jornalismo de Campo MVP</span>
        </div>
      </div>

      <div class="status-bar">
        <!-- Network status badge -->
        <span class="badge" [class.badge-online]="offlineQueue.isOnline()" [class.badge-offline]="!offlineQueue.isOnline()">
          <span class="dot"></span>
          {{ offlineQueue.isOnline() ? 'ONLINE' : 'OFFLINE' }}
        </span>

        <!-- Queue Counter badge -->
        <span *ngIf="offlineQueue.pendingCount() > 0" class="badge badge-queue" (click)="offlineQueue.triggerAutoSync()">
          <span class="spin-icon" *ngIf="offlineQueue.isSyncing()">⏳</span>
          📥 {{ offlineQueue.pendingCount() }} pendente(s)
        </span>

        <!-- User / Email Config button -->
        <button class="user-btn" (click)="openConfigModal()" title="Configurar e-mail de envio">
          👤 {{ authService.currentUser()?.name || 'Jornalista' }}
        </button>
      </div>

      <!-- USER / EMAIL CONFIG MODAL -->
      <div *ngIf="showConfigModal()" class="modal-backdrop" (click)="closeConfigModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>⚙️ Configurações do Jornalista</h3>
            <button class="btn-close" (click)="closeConfigModal()">✕</button>
          </div>

          <div class="modal-body">
            <label class="input-label">
              📧 E-mail de Envio (Notícias & Rádio):
            </label>
            <input 
              type="email" 
              class="email-input" 
              [(ngModel)]="tempEmail" 
              placeholder="Digite o e-mail de destino..."
            />
            <p class="input-help">
              As matérias do site e os roteiros para rádio serão entregues neste e-mail a cada envio.
            </p>

            <div class="saved-alert" *ngIf="savedSuccess()">
              ✅ E-mail salvo com sucesso!
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-save" (click)="saveEmail()">
              💾 Salvar E-mail
            </button>
            <button type="button" class="btn-logout" (click)="logout()">
              🚪 Sair da conta
            </button>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .app-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 14px;
      background-color: #0f172a;
      color: #ffffff;
      box-shadow: 0 2px 10px rgba(0,0,0,0.15);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .logo-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .logo-icon {
      font-size: 22px;
    }

    .logo-text h1 {
      font-size: 15px;
      font-weight: 700;
      margin: 0;
      line-height: 1.1;
      color: #38bdf8;
      letter-spacing: -0.3px;
    }

    .logo-text .subhead {
      font-size: 9px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-bar {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .badge-online {
      background-color: #064e3b;
      color: #34d399;
      border: 1px solid #10b981;
    }

    .badge-offline {
      background-color: #7f1d1d;
      color: #fca5a5;
      border: 1px solid #ef4444;
    }

    .badge-queue {
      background-color: #78350f;
      color: #fde047;
      border: 1px solid #f59e0b;
      cursor: pointer;
    }

    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: currentColor;
    }

    .user-btn {
      background: rgba(255,255,255,0.12);
      border: 1px solid rgba(255,255,255,0.25);
      color: #f8fafc;
      padding: 5px 10px;
      border-radius: 16px;
      font-size: 11px;
      cursor: pointer;
      font-weight: 600;
      transition: background 0.2s;
    }

    .user-btn:hover {
      background: rgba(255,255,255,0.25);
    }

    /* Modal Backdrop */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100%;
      height: 100%;
      background: rgba(15, 23, 42, 0.82);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      z-index: 300;
    }

    .modal-card {
      background: #ffffff;
      border-radius: 16px;
      padding: 20px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      color: #1e293b;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 10px;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 16px;
      color: #0f172a;
    }

    .btn-close {
      background: none;
      border: none;
      font-size: 16px;
      cursor: pointer;
      color: #64748b;
    }

    .modal-body {
      margin-bottom: 20px;
    }

    .input-label {
      display: block;
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 6px;
      color: #334155;
    }

    .email-input {
      width: 100%;
      padding: 10px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 14px;
      box-sizing: border-box;
      outline: none;
    }

    .email-input:focus {
      border-color: #2563eb;
    }

    .input-help {
      font-size: 11px;
      color: #64748b;
      margin: 6px 0 0 0;
      line-height: 1.4;
    }

    .saved-alert {
      margin-top: 10px;
      background-color: #dcfce7;
      color: #15803d;
      border: 1px solid #86efac;
      padding: 8px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      text-align: center;
    }

    .modal-actions {
      display: flex;
      gap: 10px;
    }

    .btn-save {
      flex: 1;
      padding: 10px;
      background-color: #2563eb;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
    }

    .btn-logout {
      padding: 10px 14px;
      background-color: #f1f5f9;
      color: #dc2626;
      border: 1px solid #fca5a5;
      border-radius: 8px;
      font-weight: 600;
      font-size: 12px;
      cursor: pointer;
    }

    @media (max-width: 480px) {
      .logo-text .subhead {
        display: none;
      }
    }
  `]
})
export class HeaderComponent {
  authService = inject(AuthService);
  offlineQueue = inject(OfflineQueueService);

  showConfigModal = signal<boolean>(false);
  savedSuccess = signal<boolean>(false);
  tempEmail = '';

  openConfigModal(): void {
    this.tempEmail = this.authService.destinationEmail();
    this.savedSuccess.set(false);
    this.showConfigModal.set(true);
  }

  closeConfigModal(): void {
    this.showConfigModal.set(false);
  }

  saveEmail(): void {
    if (this.tempEmail) {
      this.authService.setDestinationEmail(this.tempEmail);
      this.savedSuccess.set(true);
      setTimeout(() => {
        this.closeConfigModal();
      }, 1000);
    }
  }

  logout(): void {
    this.authService.logout();
    this.closeConfigModal();
  }
}
