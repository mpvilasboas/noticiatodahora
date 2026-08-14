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
          <div class="brand-badge">NT</div>
          <h2>Acesso do Repórter</h2>
          <p>Informe suas credenciais da redação para acessar o sistema de campo.</p>
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
              placeholder="repórter@noticiatodahora.com.br"
              class="form-control"
            />
          </div>

          <div class="form-group">
            <label for="password">Senha</label>
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
            <span *ngIf="!loading">Entrar no Sistema →</span>
            <span *ngIf="loading">Autenticando...</span>
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
      height: calc(100dvh - 52px);
      padding: 20px;
      background-color: #09090b;
      box-sizing: border-box;
    }

    .login-card {
      width: 100%;
      max-width: 380px;
      background: #121215;
      padding: 32px 28px;
      border-radius: 12px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.9);
      border: 1px solid #27272a;
    }

    .login-header {
      text-align: center;
      margin-bottom: 28px;
    }

    .brand-badge {
      width: 36px;
      height: 36px;
      background-color: #ffffff;
      color: #09090b;
      font-size: 13px;
      font-weight: 800;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      margin-bottom: 12px;
      letter-spacing: -0.5px;
    }

    .login-header h2 {
      font-size: 18px;
      font-weight: 600;
      color: #ffffff;
      margin: 0 0 6px 0;
      letter-spacing: -0.01em;
    }

    .login-header p {
      font-size: 12px;
      color: #71717a;
      margin: 0;
      line-height: 1.4;
    }

    .form-group {
      margin-bottom: 18px;
    }

    .form-group label {
      display: block;
      font-size: 11px;
      font-weight: 600;
      color: #71717a;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }

    .form-control {
      width: 100%;
      padding: 10px 12px;
      background-color: #18181b;
      border: 1px solid #27272a;
      border-radius: 8px;
      font-size: 13px;
      color: #ffffff;
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.15s;
    }

    .form-control::placeholder {
      color: #71717a;
    }

    .form-control:focus {
      border-color: #52525b;
    }

    .btn-submit {
      width: 100%;
      padding: 12px;
      background-color: #ffffff;
      color: #09090b;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 8px;
      transition: background-color 0.15s;
    }

    .btn-submit:hover {
      background-color: #e4e4e7;
    }

    .btn-submit:disabled {
      background-color: #27272a;
      color: #71717a;
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
