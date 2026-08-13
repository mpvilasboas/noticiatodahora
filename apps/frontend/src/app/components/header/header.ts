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
        <div class="brand-mark">NT</div>
        <div class="logo-text">
          <h1>NOTÍCIA TODA HORA</h1>
          <span class="subhead">Jornalismo de Campo</span>
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
          {{ offlineQueue.pendingCount() }} na fila
        </span>

        <!-- User / Email Config button -->
        <button class="user-btn" (click)="openConfigModal()" title="Configurar e-mail de envio">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span>{{ authService.currentUser()?.name || 'Repórter' }}</span>
        </button>
      </div>

      <!-- USER / EMAIL CONFIG MODAL -->
      <div *ngIf="showConfigModal()" class="modal-backdrop" (click)="closeConfigModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Configurações do Repórter</h3>
            <button class="btn-close" (click)="closeConfigModal()">✕</button>
          </div>

          <div class="modal-body">
            <label class="input-label">
              E-mail de Destino das Matérias
            </label>
            <input 
              type="email" 
              class="email-input" 
              [(ngModel)]="tempEmail" 
              placeholder="seu-email@portal.com.br"
            />
            <p class="input-help">
              As matérias geradas para o portal e rádio serão entregues neste endereço.
            </p>

            <div class="saved-alert" *ngIf="savedSuccess()">
              ✓ E-mail salvo com sucesso
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-save" (click)="saveEmail()">
              Salvar Alterações
            </button>
            <button type="button" class="btn-logout" (click)="logout()">
              Sair
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
      padding: 12px 18px;
      background-color: #09090b;
      color: #ffffff;
      border-bottom: 1px solid #18181b;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .logo-container {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .brand-mark {
      width: 28px;
      height: 28px;
      background-color: #ffffff;
      color: #09090b;
      font-size: 11px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      letter-spacing: -0.5px;
    }

    .logo-text h1 {
      font-size: 12px;
      font-weight: 700;
      margin: 0;
      line-height: 1.1;
      color: #ffffff;
      letter-spacing: 0.05em;
    }

    .logo-text .subhead {
      font-size: 9px;
      color: #71717a;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .status-bar {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.05em;
    }

    .badge-online {
      background-color: #091f15;
      color: #4ade80;
      border: 1px solid #166534;
    }

    .badge-offline {
      background-color: #2a0c10;
      color: #fca5a5;
      border: 1px solid #991b1b;
    }

    .badge-queue {
      background-color: #271a0c;
      color: #fde047;
      border: 1px solid #b45309;
      cursor: pointer;
    }

    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: currentColor;
    }

    .user-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #18181b;
      border: 1px solid #27272a;
      color: #e4e4e7;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      cursor: pointer;
      font-weight: 500;
      transition: background 0.15s, border-color 0.15s;
    }

    .user-btn:hover {
      background: #27272a;
      border-color: #3f3f46;
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
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      z-index: 300;
    }

    .modal-card {
      background: #09090b;
      border-radius: 12px;
      padding: 24px;
      width: 100%;
      max-width: 400px;
      border: 1px solid #27272a;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.9);
      color: #f4f4f5;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      border-bottom: 1px solid #18181b;
      padding-bottom: 12px;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: #ffffff;
      letter-spacing: -0.01em;
    }

    .btn-close {
      background: none;
      border: none;
      font-size: 14px;
      cursor: pointer;
      color: #71717a;
      transition: color 0.15s;
    }

    .btn-close:hover {
      color: #ffffff;
    }

    .modal-body {
      margin-bottom: 24px;
    }

    .input-label {
      display: block;
      font-size: 12px;
      font-weight: 500;
      margin-bottom: 8px;
      color: #a1a1aa;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .email-input {
      width: 100%;
      padding: 10px 12px;
      background-color: #121215;
      border: 1px solid #27272a;
      color: #ffffff;
      border-radius: 8px;
      font-size: 14px;
      box-sizing: border-box;
      outline: none;
      transition: border-color 0.15s;
    }

    .email-input:focus {
      border-color: #52525b;
    }

    .input-help {
      font-size: 12px;
      color: #71717a;
      margin: 8px 0 0 0;
      line-height: 1.4;
    }

    .saved-alert {
      margin-top: 12px;
      background-color: #052e16;
      color: #4ade80;
      border: 1px solid #166534;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      text-align: center;
    }

    .modal-actions {
      display: flex;
      gap: 10px;
    }

    .btn-save {
      flex: 1;
      padding: 10px 16px;
      background-color: #ffffff;
      color: #09090b;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      transition: background-color 0.15s;
    }

    .btn-save:hover {
      background-color: #e4e4e7;
    }

    .btn-logout {
      padding: 10px 14px;
      background-color: #18181b;
      color: #f87171;
      border: 1px solid #27272a;
      border-radius: 8px;
      font-weight: 500;
      font-size: 12px;
      cursor: pointer;
      transition: background 0.15s;
    }

    .btn-logout:hover {
      background-color: #27272a;
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
      }, 1200);
    }
  }

  logout(): void {
    this.authService.logout();
    this.closeConfigModal();
  }
}
