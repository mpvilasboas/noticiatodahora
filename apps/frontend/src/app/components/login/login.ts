import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <span class="icon">🎙️</span>
          <h2>Acesso do Jornalista</h2>
          <p>Digite suas credenciais da redação para entrar no sistema de campo.</p>
        </div>

        <form (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group">
            <label for="email">E-mail Corporativo</label>
            <input 
              type="email" 
              id="email" 
              [(ngModel)]="email" 
              name="email" 
              required 
              placeholder="seu.nome@noticiatodahora.com"
              class="form-control"
            />
          </div>

          <div class="form-group">
            <label for="password">Senha da Redação</label>
            <input 
              type="password" 
              id="password" 
              [(ngModel)]="password" 
              name="password" 
              required 
              placeholder="••••••••"
              class="form-control"
            />
          </div>

          <button type="submit" class="btn-submit" [disabled]="loading">
            <span *ngIf="!loading">Entrar no Sistema</span>
            <span *ngIf="loading">Entrando...</span>
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 70px);
      padding: 20px;
      background-color: #f8fafc;
    }

    .login-card {
      width: 100%;
      max-width: 380px;
      background: #ffffff;
      padding: 28px 24px;
      border-radius: 16px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.01);
      border: 1px solid #e2e8f0;
    }

    .login-header {
      text-align: center;
      margin-bottom: 24px;
    }

    .login-header .icon {
      font-size: 36px;
      display: inline-block;
      margin-bottom: 8px;
    }

    .login-header h2 {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 6px 0;
    }

    .login-header p {
      font-size: 13px;
      color: #64748b;
      margin: 0;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-group label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: #334155;
      margin-bottom: 6px;
    }

    .form-control {
      width: 100%;
      padding: 12px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.2s;
    }

    .form-control:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
    }

    .btn-submit {
      width: 100%;
      padding: 14px;
      background-color: #2563eb;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 8px;
      transition: background-color 0.2s;
    }

    .btn-submit:hover {
      background-color: #1d4ed8;
    }

    .btn-submit:disabled {
      background-color: #94a3b8;
      cursor: not-allowed;
    }
  `]
})
export class LoginComponent {
  authService = inject(AuthService);

  email = 'jornalista@noticiatodahora.com';
  password = 'password123';
  loading = false;

  async onSubmit() {
    if (!this.email || !this.password) return;
    this.loading = true;
    await this.authService.login(this.email, this.password);
    this.loading = false;
  }
}
