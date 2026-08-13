import { Injectable, signal } from '@angular/core';

export interface User {
  id: string;
  email: string;
  name?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser = signal<User | null>(null);
  token = signal<string | null>(null);
  destinationEmail = signal<string>('matheuspvilasboas@gmail.com');

  constructor() {
    let savedToken: string | null = null;
    let savedUser: string | null = null;
    let savedDestEmail: string | null = null;

    if (typeof localStorage !== 'undefined') {
      savedToken = localStorage.getItem('nth_auth_token');
      savedUser = localStorage.getItem('nth_auth_user');
      savedDestEmail = localStorage.getItem('nth_destination_email');
    }

    if (savedDestEmail) {
      this.destinationEmail.set(savedDestEmail);
    }

    if (savedToken) {
      this.token.set(savedToken);
    } else {
      const devToken = 'dev-jwt-token-noticiatodahora';
      this.token.set(devToken);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('nth_auth_token', devToken);
      }
    }

    if (savedUser) {
      try {
        this.currentUser.set(JSON.parse(savedUser));
      } catch (e) {
        this.setDefaultUser();
      }
    } else {
      this.setDefaultUser();
    }
  }

  setDestinationEmail(email: string): void {
    const trimmed = email.trim();
    if (trimmed) {
      this.destinationEmail.set(trimmed);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('nth_destination_email', trimmed);
      }
    }
  }

  private setDefaultUser(): void {
    const defaultUser: User = {
      id: 'jornalista-demo-1',
      email: 'jornalista@noticiatodahora.com',
      name: 'Repórter de Campo'
    };
    this.currentUser.set(defaultUser);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('nth_auth_user', JSON.stringify(defaultUser));
    }
  }

  login(email: string, password: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const user: User = {
          id: `usr-${Date.now()}`,
          email: email,
          name: email.split('@')[0]
        };
        const mockToken = `jwt-token-${Date.now()}`;
        
        this.currentUser.set(user);
        this.token.set(mockToken);

        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('nth_auth_user', JSON.stringify(user));
          localStorage.setItem('nth_auth_token', mockToken);
        }
        resolve(true);
      }, 500);
    });
  }

  logout(): void {
    this.currentUser.set(null);
    this.token.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('nth_auth_user');
      localStorage.removeItem('nth_auth_token');
    }
  }

  isAuthenticated(): boolean {
    return !!this.token();
  }
}
