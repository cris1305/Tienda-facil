import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Tienda } from '../models';

interface SearchResult {
  tienda: Tienda;
  ownerName: string;
}

@Injectable({
  providedIn: 'root'
})
export class TiendaService {
  private http = inject(HttpClient);
  private apiUrl = 'http://127.0.0.1:5000/api';

  async getTiendaById(tiendaId: number): Promise<Tienda | null> {
    if (!tiendaId) return null;
    try {
      return await firstValueFrom(this.http.get<Tienda>(`${this.apiUrl}/tiendas/${tiendaId}`));
    } catch (error) {
      console.error('Failed to fetch tienda', error);
      return null;
    }
  }

  async updateVendedorPin(tiendaId: number, newPin: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.put(`${this.apiUrl}/tiendas/${tiendaId}/pin`, { pin: newPin }));
      return true;
    } catch (error) {
      console.error('Failed to update PIN', error);
      return false;
    }
  }

  async updateTiendaDetails(tiendaId: number, details: { name: string, email?: string, phone?: string, image?: string }): Promise<boolean> {
    try {
      await firstValueFrom(this.http.put(`${this.apiUrl}/tiendas/${tiendaId}/settings`, details));
      return true;
    } catch (error) {
      console.error('Failed to update tienda details', error);
      return false;
    }
  }

  async searchTiendas(searchTerm: string): Promise<SearchResult[]> {
    if (!searchTerm) return [];
    try {
      return await firstValueFrom(this.http.get<SearchResult[]>(`${this.apiUrl}/tiendas/search`, { params: { q: searchTerm } }));
    } catch (error) {
      console.error('Failed to search tiendas', error);
      return [];
    }
  }

  async verifyPin(tiendaId: number, pin: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(this.http.post<{ success: boolean }>(`${this.apiUrl}/tiendas/${tiendaId}/verify-pin`, { pin }));
      return response.success;
    } catch (error) {
      return false; // Errors (like 401 for wrong pin) mean verification failed.
    }
  }
}
