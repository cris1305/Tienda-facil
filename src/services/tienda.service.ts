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
      // FIX: Explicitly type `tienda` to resolve a potential type inference issue with `firstValueFrom`.
      const tienda: Tienda = await firstValueFrom(this.http.get<Tienda>(`${this.apiUrl}/tiendas/${tiendaId}`));
      return tienda;
    } catch (error) {
      console.error('Failed to fetch tienda', error);
      return null;
    }
  }

  async createTienda(tiendaName: string): Promise<Tienda | null> {
    try {
      // The backend will associate the logged-in user (admin) as the owner
      // FIX: Explicitly type `newTienda` to resolve a type inference issue with `firstValueFrom`.
      const newTienda: Tienda = await firstValueFrom(
        this.http.post<Tienda>(`${this.apiUrl}/tiendas`, { name: tiendaName })
      );
      return newTienda;
    } catch (error) {
      console.error('Failed to create tienda', error);
      return null;
    }
  }

  async updateVendedorPin(tiendaId: number, newPin: string): Promise<boolean> {
    try {
      // FIX: Add explicit response type for HttpClient method to improve type safety.
      await firstValueFrom(this.http.put<{ success: boolean }>(`${this.apiUrl}/tiendas/${tiendaId}/pin`, { pin: newPin }));
      return true;
    } catch (error) {
      console.error('Failed to update PIN', error);
      return false;
    }
  }

  async updateTiendaDetails(tiendaId: number, details: { name: string, email?: string, phone?: string, image?: string }): Promise<boolean> {
    try {
      // FIX: Add explicit response type for HttpClient method to improve type safety.
      await firstValueFrom(this.http.put<{ success: boolean }>(`${this.apiUrl}/tiendas/${tiendaId}/settings`, details));
      return true;
    } catch (error) {
      console.error('Failed to update tienda details', error);
      return false;
    }
  }

  async searchTiendas(searchTerm: string): Promise<SearchResult[]> {
    if (!searchTerm) return [];
    try {
      // FIX: Explicitly type `results` to resolve a potential type inference issue with `firstValueFrom`.
      const results: SearchResult[] = await firstValueFrom(this.http.get<SearchResult[]>(`${this.apiUrl}/tiendas/search`, { params: { q: searchTerm } }));
      return results;
    } catch (error) {
      console.error('Failed to search tiendas', error);
      return [];
    }
  }

  async verifyPin(tiendaId: number, pin: string): Promise<boolean> {
    try {
      // Fix: Explicitly type `response` to fix type inference issue from `firstValueFrom`.
      const response: { success: boolean } = await firstValueFrom(this.http.post<{ success: boolean }>(`${this.apiUrl}/tiendas/${tiendaId}/verify-pin`, { pin }));
      return response.success;
    } catch (error: unknown) {
      return false; // Errors (like 401 for wrong pin) mean verification failed.
    }
  }
}