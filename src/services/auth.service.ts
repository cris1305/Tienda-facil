import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { User } from '../models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = 'http://127.0.0.1:5000/api'; // Base URL for our Flask API

  currentUser = signal<User | null>(null);

  constructor() {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUser.set(JSON.parse(storedUser));
    }
  }

  async register(name: string, phone: string, email: string, password: string): Promise<{ success: boolean, message: string }> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ success: boolean, message: string }>(`${this.apiUrl}/register`, { name, phone, email, password })
      );
      return response;
    } catch (error: any) {
      return { success: false, message: error.error?.message || 'Error en el registro.' };
    }
  }

  async login(contact: string, password: string): Promise<{ success: boolean, message: string, user?: User }> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ success: boolean, message: string, user: User }>(`${this.apiUrl}/login`, { contact, password })
      );
      if (response.success && response.user) {
        this.currentUser.set(response.user);
        localStorage.setItem('currentUser', JSON.stringify(response.user));
      }
      return response;
    } catch (error: any) {
      return { success: false, message: error.error?.message || 'Credenciales inválidas.' };
    }
  }

  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem('currentUser');
    this.router.navigate(['/auth']);
  }
  
  async assignTiendaToCurrentUser(tiendaId: number): Promise<void> {
    const user = this.currentUser();
    if (!user) return;

    try {
      const response = await firstValueFrom(
        this.http.post<{ success: boolean, user: User }>(`${this.apiUrl}/users/${user.id}/assign-tienda`, { tiendaId })
      );
      if (response.success && response.user) {
        this.currentUser.set(response.user);
        localStorage.setItem('currentUser', JSON.stringify(response.user));
      }
    } catch (error) {
      console.error('Failed to assign tienda', error);
    }
  }

  async getAllUsers(tiendaId: number): Promise<User[]> {
     if (!tiendaId) return [];
     try {
       return await firstValueFrom(this.http.get<User[]>(`${this.apiUrl}/tiendas/${tiendaId}/users`));
     } catch (error) {
       console.error('Failed to fetch users', error);
       return [];
     }
  }

  async getAllAdmins(): Promise<User[]> {
    try {
      return await firstValueFrom(this.http.get<User[]>(`${this.apiUrl}/users/admins`));
    } catch (error) {
      console.error('Failed to fetch admins', error);
      return [];
    }
  }
}
